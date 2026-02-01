const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken);

// Triggered by Dispatcher
router.post('/allocate', requireRole('DISPATCHER'), routeController.allocateRoutes);

module.exports = router;
