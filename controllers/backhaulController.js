const prisma = require('../config/database');

/**
 * Phase 4: The Backhaul (Step 12)
 * GET /api/backhaul/opportunities
 * For drivers on a return journey, show marketplace loads near their path
 */
exports.getOpportunities = async (req, res) => {
    try {
        const { truckId } = req.query;

        if (!truckId) {
            return res.status(400).json({ success: false, message: 'truckId is required' });
        }

        // 1. Fetch Truck and its sourceHub
        const truck = await prisma.truck.findUnique({
            where: { id: truckId },
            include: { sourceHub: true }
        });

        if (!truck || !truck.currentLat || !truck.currentLng) {
            return res.status(404).json({ success: false, message: 'Truck or location not found' });
        }

        // 2. Find Shipments that are marketplace loads and near the current position
        // and ideally headed towards the sourceHub (simplified: just near current position for now)
        const nearbyShipments = await prisma.$queryRaw`
            SELECT id, "pickupLocation", "pickupLat", "pickupLng", "dropLocation", "cargoType", "cargoWeight", ( 6371 * acos( cos( radians(${truck.currentLat}) ) * cos( radians( "pickupLat" ) ) 
            * cos( radians( "pickupLng" ) - radians(${truck.currentLng}) ) + sin( radians(${truck.currentLat}) ) 
            * sin( radians( "pickupLat" ) ) ) ) AS distance 
            FROM "Shipment" 
            WHERE "isMarketplaceLoad" = true
            AND status = 'PENDING'
            AND (6371 * acos( cos( radians(${truck.currentLat}) ) * cos( radians( "pickupLat" ) ) 
            * cos( radians( "pickupLng" ) - radians(${truck.currentLng}) ) + sin( radians(${truck.currentLat}) ) 
            * sin( radians( "pickupLat" ) ) )) < 20
            ORDER BY distance;
        `;

        res.status(200).json({
            success: true,
            data: nearbyShipments
        });

    } catch (error) {
        console.error('Backhaul Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
