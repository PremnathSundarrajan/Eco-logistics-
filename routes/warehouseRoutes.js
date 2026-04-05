// routes/warehouseRoutes.js
const express = require("express");
const router = express.Router();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getDhsCourierId } = require("../utils/db_helpers");

// 1. GET all warehouses (Powers the Map UI and Solver)
router.get("/", async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany();
    res.json({ success: true, data: warehouses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST create a new warehouse (Called from the "Add Node" Admin Map Form)
router.post("/", async (req, res) => {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      adminEmail,
      adminPhone,
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

    const dataPayload = {
      name,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      adminEmail,
      adminPhone,
      courierCompanyId: validCompanyId,
    };

    const newWarehouse = await prisma.warehouse.create({
      data: dataPayload,
    });

    res.json({ success: true, data: newWarehouse });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. DELETE a warehouse (Called when clicking the Trash icon on the map)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.warehouse.delete({
      where: { id: id }, // Ensure your DB uses strings for IDs (UUID), otherwise parse to int
    });
    res.json({ success: true, message: "Warehouse permanently deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
