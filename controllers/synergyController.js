const prisma = require('../config/database');

const CARGO_COMPATIBILITY = {
    "FOOD": ["PHARMA", "ELECTRONICS"],
    "PHARMA": ["FOOD", "ELECTRONICS"],
    "ELECTRONICS": ["FOOD", "PHARMA", "FRAGILE"],
    "CHEMICALS": ["INDUSTRIAL"],
    "INDUSTRIAL": ["CHEMICALS"],
    "FRAGILE": ["ELECTRONICS", "CLOTHING"],
    "CLOTHING": ["FRAGILE"]
};

/**
 * Haversine formula to calculate distance between two points in KM
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Check if two cargo types are compatible
 */
const areCompatible = (type1, type2) => {
    if (!type1 || !type2) return true;
    if (type1 === type2) return true;

    const compatibility = CARGO_COMPATIBILITY[type1.toUpperCase()];
    return compatibility && compatibility.includes(type2.toUpperCase());
};

/**
 * GET /api/synergy/search/:truckId
 */
const searchSynergy = async (req, res) => {
    try {
        const { truckId } = req.params;
        const io = req.app.get('io');

        // 1. Get the searching truck and its active delivery
        const searchingTruck = await prisma.truck.findUnique({
            where: { id: truckId },
            include: {
                deliveries: {
                    where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
                    include: { shipment: true }
                }
            }
        });

        if (!searchingTruck) {
            return res.status(404).json({ success: false, message: 'Truck not found' });
        }

        const activeDelivery = searchingTruck.deliveries[0];
        if (!activeDelivery) {
            return res.status(400).json({ success: false, message: 'Truck has no active delivery' });
        }

        // 2. Pull 'Active' candidates (trucks with active deliveries)
        const candidates = await prisma.truck.findMany({
            where: {
                id: { not: truckId },
                deliveries: {
                    some: { status: { notIn: ['COMPLETED', 'CANCELLED'] } }
                }
            },
            include: {
                deliveries: {
                    where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
                    include: { shipment: true }
                }
            }
        });

        const results = candidates.map(candidate => {
            const candidateDelivery = candidate.deliveries[0];
            const candidateShipment = candidateDelivery.shipment;
            const searchShipment = activeDelivery.shipment;

            // Constraint 1: Geofence (10km)
            const distance = calculateDistance(
                searchingTruck.currentLat || 0, searchingTruck.currentLng || 0,
                candidate.currentLat || 0, candidate.currentLng || 0
            );
            const geofenceMet = distance <= 10;

            // Constraint 2: Physical Capacity
            // searchingTruck.capacity is the total. activeDelivery.cargoWeight is what it's carrying.
            // Requirement: Searching truck must be able to absorb candidate's entire load.
            const remainingCapacity = (searchingTruck.capacity || 0) - (activeDelivery.cargoWeight || 0);
            const capacityMet = remainingCapacity >= (candidateDelivery.cargoWeight || 0);

            // Constraint 3: Material Safety
            const safetyMet = areCompatible(searchShipment.cargoType, candidateShipment.cargoType);

            // Constraint 4: Path Alignment (Zero-Deviation)
            // Destination or next checkpoint match
            const pathMet = activeDelivery.dropLocation === candidateDelivery.dropLocation; // Simple check as placeholder

            const synergyScore = [geofenceMet, capacityMet, safetyMet, pathMet].filter(Boolean).length;
            const highProbability = synergyScore === 4;

            return {
                id: candidate.id,
                licensePlate: candidate.licensePlate,
                distance: distance.toFixed(2),
                cargoWeight: candidateDelivery.cargoWeight,
                cargoType: candidateShipment.cargoType,
                dropLocation: candidateDelivery.dropLocation,
                constraints: {
                    geofence: geofenceMet,
                    capacity: capacityMet,
                    safety: safetyMet,
                    path: pathMet
                },
                highProbability
            };
        }).filter(r => r.constraints.geofence); // At least Geofence must be met for real-time relevance

        // Socket.io emit for high-probability matches
        const highProbMatches = results.filter(r => r.highProbability);
        if (highProbMatches.length > 0) {
            io.emit('synergy:high-probability-match', {
                searchingTruck: {
                    id: searchingTruck.id,
                    plate: searchingTruck.licensePlate
                },
                matches: highProbMatches
            });
        }

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Synergy search error:', error);
        res.status(500).json({ success: false, message: 'Failed to search synergy' });
    }
};

/**
 * POST /api/synergy/merge
 */
const confirmMerge = async (req, res) => {
    try {
        const { searchingTruckId, candidateTruckId } = req.body;

        const searchingTruck = await prisma.truck.findUnique({
            where: { id: searchingTruckId },
            include: {
                deliveries: { where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }
            }
        });

        const candidateTruck = await prisma.truck.findUnique({
            where: { id: candidateTruckId },
            include: {
                deliveries: { where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }
            }
        });

        if (!searchingTruck || !candidateTruck) {
            return res.status(404).json({ success: false, message: 'Truck(s) not found' });
        }

        const deliveryToMerge = candidateTruck.deliveries[0];

        // Driver Relay Logic: assign to driver with highest total_distance_worked and total_time_worked
        const drivers = await prisma.user.findMany({
            where: {
                id: { in: [searchingTruck.ownerId, candidateTruck.ownerId] }
            }
        });

        const optimalDriver = drivers.sort((a, b) => {
            const scoreA = (a.totalDistanceKm || 0) + (a.totalHoursWorked || 0);
            const scoreB = (b.totalDistanceKm || 0) + (b.totalHoursWorked || 0);
            return scoreB - scoreA;
        })[0];

        // Perform merge
        await prisma.$transaction([
            // Update delivery to new driver and truck
            prisma.delivery.update({
                where: { id: deliveryToMerge.id },
                data: {
                    driverId: optimalDriver.id,
                    truckId: searchingTruck.id // consolidated to searching truck
                }
            }),
            // Mark candidate truck as freed up (optional logic, but let's keep it simple)
        ]);

        res.status(200).json({
            success: true,
            message: 'Consolidation successful',
            assignedDriver: optimalDriver.name
        });
    } catch (error) {
        console.error('Synergy merge error:', error);
        res.status(500).json({ success: false, message: 'Failed to confirm merge' });
    }
};

module.exports = {
    searchSynergy,
    confirmMerge
};
