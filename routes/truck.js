const express = require("express");
const router = express.Router();
const truckController = require("../controllers/truckController");
const { authenticateToken } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getDhsCourierId } = require("../utils/db_helpers");

// POST create a new truck (Single-tenant fallback logic)
router.post("/", async (req, res) => {
  try {
    const {
      licensePlate,
      model,
      type,
      capacity,
      maxWeight,
      maxVolume,
      warehouseId,
      courierCompanyId,
      ownerId,
    } = req.body;

    // Single-tenant fallback logic
    let validCompanyId = courierCompanyId;
    if (!validCompanyId) {
      try {
        validCompanyId = await getDhsCourierId();
      } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // Owner fallback: if not provided, try to find an ADMIN user
    let validOwnerId = ownerId;
    if (!validOwnerId) {
      const user =
        (await prisma.user.findFirst({ where: { role: "ADMIN" } })) ||
        (await prisma.user.findFirst());
      if (user) validOwnerId = user.id;
    }

    const newTruck = await prisma.truck.create({
      data: {
        licensePlate,
        model,
        type,
        capacity: parseFloat(capacity) || 0,
        maxWeight: parseFloat(maxWeight) || 0,
        maxVolume: parseFloat(maxVolume) || 0,
        warehouseId: warehouseId || null,
        courierCompanyId: validCompanyId,
        ownerId: validOwnerId,
      },
    });

    res.json({ success: true, data: newTruck });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
router.use(authenticateToken);

router.post("/location", truckController.updateLocation);
// routes/truckRoutes.js (or wherever your truck logic lives)

// GET all trucks (or drivers)
router.get("/", async (req, res) => {
  try {
    const trucks = await prisma.truck.findMany({
      // We only select the fields the Frontend needs for the Map and the Route Optimizer
      // to keep the payload lightweight.
      select: {
        id: true,
        licensePlate: true,
        model: true,
        capacity: true,
        currentWeight: true,
        isAvailable: true,
        currentLat: true,
        currentLng: true,
        co2PerKm: true,
        courierCompanyId: true,

        // 👇 CRITICAL FOR PDPTW: We fetch the assigned warehouse
        warehouseId: true,

        // Included user relations just in case you use them in the UI
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
      // You might want to optionally filter out unavailable trucks
      // where: { isAvailable: true }
    });

    res.json({ success: true, data: trucks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
