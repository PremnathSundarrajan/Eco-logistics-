const prisma = require('../config/database');

/**
 * Helper to calculate haversine distance (simplistic)
 */
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * POST /api/routes/allocate
 * Triggers TSP/Greedy allocation for pending deliveries
 */
exports.allocateRoutes = async (req, res) => {
    try {
        const { courierCompanyId } = req.body;

        if (!courierCompanyId) {
            return res.status(400).json({ success: false, message: 'courierCompanyId is required' });
        }

        // 1. Fetch pending deliveries for this company
        const pendingDeliveries = await prisma.delivery.findMany({
            where: {
                courierCompanyId,
                status: 'PENDING'
            },
            orderBy: { timeWindowStart: 'asc' }
        });

        if (pendingDeliveries.length === 0) {
            return res.status(200).json({ success: true, message: 'No pending deliveries to allocate' });
        }

        // 2. Fetch available trucks for this company
        const availableTrucks = await prisma.truck.findMany({
            where: {
                courierCompanyId,
                isAvailable: true,
                registrationStatus: 'APPROVED'
            },
            include: { owner: true }
        });

        if (availableTrucks.length === 0) {
            return res.status(400).json({ success: false, message: 'No available trucks for allocation' });
        }

        // 3. Greedy Allocation Logic
        // For simplicity, we loop through trucks and fill them up with deliveries
        const allocations = [];
        let deliveryIndex = 0;

        for (const truck of availableTrucks) {
            if (deliveryIndex >= pendingDeliveries.length) break;

            let currentWeight = 0;
            let currentVolume = 0;
            const routeDeliveries = [];

            while (deliveryIndex < pendingDeliveries.length) {
                const delivery = pendingDeliveries[deliveryIndex];

                // Check capacity
                const fitsWeight = (currentWeight + delivery.cargoWeight) <= (truck.maxWeight || Infinity);
                const fitsVolume = (currentVolume + delivery.cargoVolumeLtrs) <= (truck.maxVolume || Infinity);

                if (fitsWeight && fitsVolume) {
                    routeDeliveries.push(delivery);
                    currentWeight += delivery.cargoWeight;
                    currentVolume += delivery.cargoVolumeLtrs;
                    deliveryIndex++;
                } else {
                    // Truck full
                    break;
                }
            }

            if (routeDeliveries.length > 0) {
                allocations.push({
                    truck,
                    deliveries: routeDeliveries,
                    totalWeight: currentWeight,
                    totalVolume: currentVolume
                });
            }
        }

        // 4. Create OptimizedRoute records and update deliveries
        const results = await prisma.$transaction(async (tx) => {
            const createdRoutes = [];

            for (const alloc of allocations) {
                const { truck, deliveries, totalWeight, totalVolume } = alloc;

                // Create Route
                const route = await tx.optimizedRoute.create({
                    data: {
                        courierCompanyId,
                        truckId: truck.id,
                        driverId: truck.ownerId,
                        totalDistance: 0, // Placeholder
                        totalDuration: 60, // Placeholder
                        estimatedStartTime: new Date(),
                        estimatedEndTime: new Date(Date.now() + 3600000),
                        totalPackages: deliveries.length,
                        totalWeight,
                        totalVolume,
                        utilizationPercent: truck.maxWeight ? (totalWeight / truck.maxWeight) * 100 : 0,
                        baselineDistance: 0,
                        carbonSaved: 0,
                        emptyMilesSaved: 0,
                        status: 'ALLOCATED'
                    }
                });

                // Update Deliveries
                await tx.delivery.updateMany({
                    where: { id: { in: deliveries.map(d => d.id) } },
                    data: {
                        truckId: truck.id,
                        driverId: truck.ownerId,
                        optimizedRouteId: route.id,
                        status: 'ALLOCATED'
                    }
                });

                // Update Truck availability
                await tx.truck.update({
                    where: { id: truck.id },
                    data: { isAvailable: false }
                });

                createdRoutes.push(route);
            }
            return createdRoutes;
        });

        res.status(201).json({
            success: true,
            message: `Allocated ${allocations.length} routes for ${pendingDeliveries.length} packages`,
            data: results
        });

    } catch (err) {
        console.error('Allocation Error:', err);
        res.status(500).json({ success: false, message: 'Internal server error during allocation', error: err.message });
    }
};
