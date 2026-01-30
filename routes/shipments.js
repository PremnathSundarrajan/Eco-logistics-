const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Shipper-only routes
router.post('/create', requireRole('SHIPPER'), shipmentController.createShipment);
router.get('/my-shipments', requireRole('SHIPPER'), shipmentController.getMyShipments);
router.get('/:id', requireRole('SHIPPER'), shipmentController.getShipment);
router.put('/:id/cancel', requireRole('SHIPPER'), shipmentController.cancelShipment);

module.exports = router;
