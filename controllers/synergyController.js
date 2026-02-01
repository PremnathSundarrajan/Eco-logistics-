const prisma = require('../config/database');

/**
 * Phase 2: Real-time Proximity & Detection
 * Logic to detect overlaps and create Absorption Opportunities
 */
async function detectAbsorptionOpportunity(truckId, lat, lng, io) {
    try {
        // 1. Find searching truck and its active route
        const truckA = await prisma.truck.findUnique({
            where: { id: truckId },
            include: {
                optimizedRoutes: {
                    where: { status: 'ACTIVE' },
                    include: { deliveries: true }
                }
            }
        });

        if (!truckA || truckA.optimizedRoutes.length === 0) return null;
        const routeA = truckA.optimizedRoutes[0];

        // 2. Find nearby Trucks (Truck B) within 5km
        // Using raw query for haversine
        const nearbyTrucks = await prisma.$queryRaw`
            SELECT id, "currentLat", "currentLng", ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( "currentLat" ) ) 
            * cos( radians( "currentLng" ) - radians(${lng}) ) + sin( radians(${lat}) ) 
            * sin( radians( "currentLat" ) ) ) ) AS distance 
            FROM "Truck" 
            WHERE id != ${truckId}
            AND (6371 * acos( cos( radians(${lat}) ) * cos( radians( "currentLat" ) ) 
            * cos( radians( "currentLng" ) - radians(${lng}) ) + sin( radians(${lat}) ) 
            * sin( radians( "currentLat" ) ) )) < 5
        `;

        for (const candidate of nearbyTrucks) {
            const truckB = await prisma.truck.findUnique({
                where: { id: candidate.id },
                include: {
                    optimizedRoutes: { where: { status: 'ACTIVE' }, include: { deliveries: true } }
                }
            });

            if (!truckB || truckB.optimizedRoutes.length === 0) continue;
            const routeB = truckB.optimizedRoutes[0];

            // 3. Find nearby VirtualHub (within radius or 5km)
            const nearbyHubs = await prisma.$queryRaw`
                SELECT id, latitude, longitude, radius, ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( "latitude" ) ) 
                * cos( radians( "longitude" ) - radians(${lng}) ) + sin( radians(${lat}) ) 
                * sin( radians( "latitude" ) ) ) ) AS distance 
                FROM "VirtualHub" 
                WHERE (6371 * acos( cos( radians(${lat}) ) * cos( radians( "latitude" ) ) 
                * cos( radians( "longitude" ) - radians(${lng}) ) + sin( radians(${lat}) ) 
                * sin( radians( "latitude" ) ) )) < 5
                LIMIT 1
            `;

            if (nearbyHubs.length === 0) continue;
            const hub = nearbyHubs[0];

            // 4. Constraint Logic: Capacity check
            // Calculate Truck A residual capacity
            const availableWeightA = (truckA.maxWeight || 0) - (truckA.currentWeight || 0);
            const availableVolumeA = (truckA.maxVolume || 0) - (truckA.currentVolume || 0);

            // Can A absorb B's load?
            const canAbsorb = (availableWeightA >= truckB.currentWeight) && (availableVolumeA >= truckB.currentVolume);
            if (!canAbsorb) continue;

            // 5. Calculate Carbon Savings
            const distanceSaved = candidate.distance; // Simplified: overlap distance approx dist between trucks
            const carbonSaved = distanceSaved * (truckA.co2PerKm || 0.5);

            // 6. Create Opportunity
            const opportunity = await prisma.absorptionOpportunity.create({
                data: {
                    route1Id: routeA.id,
                    route2Id: routeB.id,
                    overlapDistanceKm: parseFloat(distanceSaved),
                    overlapStartTime: new Date(),
                    overlapEndTime: new Date(Date.now() + 3600000),
                    nearestHubId: hub.id,
                    overlapCenterLat: lat,
                    overlapCenterLng: lng,
                    estimatedMeetTime: new Date(Date.now() + 1800000),
                    timeWindow: 30,
                    eligibleDeliveryIds: routeB.deliveries.map(d => d.id).join(','),
                    truck1DistanceBefore: 0,
                    truck1DistanceAfter: 0,
                    truck2DistanceBefore: 0,
                    truck2DistanceAfter: 0,
                    totalDistanceSaved: parseFloat(distanceSaved),
                    potentialCarbonSaved: carbonSaved,
                    spaceRequiredVolume: truckB.currentVolume,
                    spaceRequiredWeight: truckB.currentWeight,
                    truck1SpaceAvailable: availableVolumeA,
                    truck2SpaceAvailable: (truckB.maxVolume || 0) - (truckB.currentVolume || 0),
                    expiresAt: new Date(Date.now() + 3600000),
                    status: 'PENDING'
                }
            });

            // 7. Socket Notification
            io.emit('synergy:absorption_opportunity', {
                opportunityId: opportunity.id,
                truckA: truckA.id,
                truckB: truckB.id,
                hub: hub.id,
                carbonSaved: carbonSaved.toFixed(2)
            });

            return opportunity;
        }

        return null;
    } catch (error) {
        console.error('Proximity detection error:', error);
        return null;
    }
}

/**
 * Phase 3: Handshake & Transfer
 * Handles QR scan and workload-based relay
 */
async function handleHandshake(req, res) {
    try {
        const { opportunityId, qrData } = req.body;
        const io = req.app.get('io');

        // 1. Fetch Opportunity
        const opportunity = await prisma.absorptionOpportunity.findUnique({
            where: { id: opportunityId },
            include: {
                route1: { include: { truck: { include: { owner: true } } } },
                route2: { include: { truck: { include: { owner: true } } } }
            }
        });

        if (!opportunity) {
            return res.status(404).json({ success: false, message: 'Opportunity not found' });
        }

        // 2. Driver Relay Rule: Assign longer segment to driver with higher workload
        // Workload = totalDistanceKm + totalHoursWorked
        const driver1 = opportunity.route1.truck.owner;
        const driver2 = opportunity.route2.truck.owner;

        const workload1 = (driver1.totalDistanceKm || 0) + (driver1.totalHoursWorked || 0);
        const workload2 = (driver2.totalDistanceKm || 0) + (driver2.totalHoursWorked || 0);

        let longHaulDriver, shortHaulDriver, masterTruckId;
        if (workload1 >= workload2) {
            longHaulDriver = driver1;
            shortHaulDriver = driver2;
            masterTruckId = opportunity.route1.truck.id;
        } else {
            longHaulDriver = driver2;
            shortHaulDriver = driver1;
            masterTruckId = opportunity.route2.truck.id;
        }

        // 3. Update Status and finalize transfer
        await prisma.$transaction([
            // Update opportunity status
            prisma.absorptionOpportunity.update({
                where: { id: opportunityId },
                data: { status: 'COMPLETED' }
            }),
            // Reassign deliveries from Route 2 to Truck A (if Route 1 is the master)
            prisma.delivery.updateMany({
                where: { optimizedRouteId: opportunity.route2Id },
                data: {
                    truckId: masterTruckId,
                    driverId: longHaulDriver.id,
                    status: 'ABSORPTION_TRANSFERRED'
                }
            })
        ]);

        // 4. Emit Completion
        io.emit('synergy:absorption_completed', {
            opportunityId,
            assignedDriver: longHaulDriver.name
        });

        res.status(200).json({
            success: true,
            message: 'Handshake completed and relay rule applied',
            data: {
                longHaulDriver: longHaulDriver.name,
                shortHaulDriver: shortHaulDriver.name
            }
        });

    } catch (error) {
        console.error('Handshake Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

/**
 * Legacy Search API (Updated for new schema)
 */
async function searchSynergy(req, res) {
    try {
        const { truckId } = req.body;
        // Simplified search using distance detect logic
        const truck = await prisma.truck.findUnique({ where: { id: truckId } });
        if (!truck) return res.status(404).json({ message: 'Truck not found' });

        const opportunity = await detectAbsorptionOpportunity(truckId, truck.currentLat, truck.currentLng, req.app.get('io'));

        res.status(200).json({
            success: true,
            opportunity
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Phase 2.5: Accept Synergy
 */
async function acceptSynergy(req, res) {
    try {
        const { opportunityId, routeId } = req.body;

        const opportunity = await prisma.absorptionOpportunity.findUnique({
            where: { id: opportunityId }
        });

        if (!opportunity) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }

        let updateData = {};
        if (opportunity.route1Id === routeId) {
            updateData.status = opportunity.status === 'ACCEPTED_BY_ROUTE2' ? 'BOTH_ACCEPTED' : 'ACCEPTED_BY_ROUTE1';
            updateData.acceptedByRoute1At = new Date();
        } else if (opportunity.route2Id === routeId) {
            updateData.status = opportunity.status === 'ACCEPTED_BY_ROUTE1' ? 'BOTH_ACCEPTED' : 'ACCEPTED_BY_ROUTE2';
            updateData.acceptedByRoute2At = new Date();
        } else {
            return res.status(400).json({ message: 'Route ID does not match this opportunity' });
        }

        const updated = await prisma.absorptionOpportunity.update({
            where: { id: opportunityId },
            data: updateData
        });

        res.status(200).json({
            success: true,
            opportunity: updated
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    detectAbsorptionOpportunity,
    handleHandshake,
    searchSynergy,
    acceptSynergy
};
