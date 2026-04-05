const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { detectAbsorptionOpportunity } = require('./synergyController');

/**
 * POST /api/trucks/location
 * Updates truck GPS and triggers proximity check
 */
exports.updateLocation = async (req, res) => {
    try {
        const { truckId, lat, lng, speed, heading } = req.body;
        const io = req.app.get('io');

        if (!truckId || lat === undefined || lng === undefined) {
            return res.status(400).json({ success: false, message: 'truckId, lat, and lng are required' });
        }

        // 1. Update Truck current location
        const truck = await prisma.truck.update({
            where: { id: truckId },
            data: {
                currentLat: lat,
                currentLng: lng
            }
        });

        // 2. Log GPS coordinate
        await prisma.gPSLog.create({
            data: {
                truckId,
                latitude: lat,
                longitude: lng,
                speed,
                heading
            }
        });

        // 3. Trigger Proximity Check
        const opportunity = await detectAbsorptionOpportunity(truckId, lat, lng, io);

        res.status(200).json({
            success: true,
            message: 'Location updated',
            opportunityDetected: !!opportunity
        });

    } catch (error) {
        console.error('Update Location Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * GET /api/trucks
 * Fetch all trucks (lightweight admin view)
 */
exports.getAllTrucks = async (req, res) => {
    try {
        const trucks = await prisma.truck.findMany();
        res.status(200).json(trucks);
    } catch (err) {
        console.error("Fetch Trucks Error:", err);
        res.status(500).json({ message: "Failed to fetch trucks." });
    }
};

/**
 * GET /api/trucks/:id
 * Fetch a single truck by ID
 */
exports.getTruckById = async (req, res) => {
    try {
        const truck = await prisma.truck.findUnique({
            where: { id: req.params.id }
        });
        if (!truck) return res.status(404).json({ message: "Truck not found." });
        res.status(200).json(truck);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch truck." });
    }
};

/**
 * POST /api/trucks
 * Create a new truck (handled inline in routes/truck.js for existing app compatibility)
 */
exports.createTruck = async (req, res) => {
    try {
        const payload = req.body;

        const newTruck = await prisma.truck.create({
            data: {
                licensePlate: payload.licensePlate,
                model: payload.model,
                type: payload.type,
                capacity: parseFloat(payload.capacity) || 0,
                maxWeight: parseFloat(payload.maxWeight) || 0,
                maxVolume: parseFloat(payload.maxVolume) || 0,
                warehouseId: payload.warehouseId || null,
                isAvailable: true,
                ownerId: req.user?.id || null
            }
        });
        res.status(201).json(newTruck);
    } catch (err) {
        console.error("Create Truck Error:", err);
        if (err.code === 'P2002') return res.status(400).json({ message: "A truck with this license plate already exists." });
        res.status(500).json({ message: "Failed to create truck." });
    }
};

/**
 * PUT /api/trucks/:id
 * Update an existing truck
 */
exports.updateTruck = async (req, res) => {
    try {
        const updatedTruck = await prisma.truck.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.status(200).json(updatedTruck);
    } catch (err) {
        res.status(500).json({ message: "Failed to update truck." });
    }
};

/**
 * DELETE /api/trucks/:id
 * Remove a truck
 */
exports.deleteTruck = async (req, res) => {
    try {
        await prisma.truck.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: "Truck successfully removed." });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete truck." });
    }
};
