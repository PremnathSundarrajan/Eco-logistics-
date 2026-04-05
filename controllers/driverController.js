// src/controllers/driverController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fetch all users designated as DRIVERS
exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await prisma.user.findMany({
            where: { role: 'DRIVER' }
        });
        res.status(200).json(drivers);
    } catch (err) {
        console.error("Fetch Drivers Error:", err);
        res.status(500).json({ message: "Failed to fetch drivers." });
    }
};

// Fetch a single driver by ID
exports.getDriverById = async (req, res) => {
    try {
        const driver = await prisma.user.findUnique({
            where: {
                id: req.params.id,
                role: 'DRIVER'
            }
        });
        if (!driver) return res.status(404).json({ message: "Driver not found." });
        res.status(200).json(driver);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch driver." });
    }
};

// Create a new Driver
exports.createDriver = async (req, res) => {
    try {
        const body = req.body;

        // Accept various name field keys the frontend might send
        const name = body.name || body.driverName || body.fullName || body.driver_name;
        const phone = body.phone || body.phoneNumber || body.mobile;
        const vehicleType = body.vehicleType || body.vehicle_type || body.type;
        const currentVehicleNo = body.currentVehicleNo || body.licensePlate || body.vehiclePlate || body.plate;
        const homeBaseCity = body.homeBaseCity || body.city || body.location;
        const avatarColor = body.avatarColor || body.color;
        const initials = body.initials;
        const status = body.status;

        if (!name) {
            return res.status(400).json({
                message: "Name is required.",
                hint: "Send 'name', 'driverName', or 'fullName' in the request body.",
                receivedFields: Object.keys(body)  // shows what fields were actually sent
            });
        }

        // phone is required+unique in DB — generate a placeholder if not provided
        const uniquePhone = phone && phone.trim() !== ""
            ? phone.trim()
            : `unset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        const newDriver = await prisma.user.create({
            data: {
                name,
                phone: uniquePhone,
                role: 'DRIVER',
                vehicleType: vehicleType || null,
                currentVehicleNo: currentVehicleNo || null,
                homeBaseCity: homeBaseCity || null,
                avatarColor: avatarColor || null,
                initials: initials || null,
                status: status || 'ON_DUTY'
            }
        });

        res.status(201).json(newDriver);
    } catch (err) {
        console.error("Create Driver Error:", err);
        if (err.code === 'P2002') {
            return res.status(400).json({ message: "A driver with this phone number already exists." });
        }
        res.status(500).json({ message: "Failed to create driver.", error: err.message });
    }
};

// Update an existing driver
exports.updateDriver = async (req, res) => {
    try {
        const updatedDriver = await prisma.user.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.status(200).json(updatedDriver);
    } catch (err) {
        res.status(500).json({ message: "Failed to update driver." });
    }
};

// Delete a driver
exports.deleteDriver = async (req, res) => {
    try {
        await prisma.user.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: "Driver successfully removed." });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete driver." });
    }
};

exports.getActiveRoute = async (req, res) => {
    try {
        const { truckId } = req.params;
        const activeRoute = await prisma.optimizedRoute.findFirst({
            where: {
                truckId: truckId,
                status: { in: ['Allocated', 'Active'] }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!activeRoute) {
            return res.status(404).json({ message: 'No active route found' });
        }

        res.json({
            truckId: truckId,
            routeId: activeRoute.id,
            polyline: activeRoute.routePolyline,
            checkpoints: activeRoute.waypoints || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};