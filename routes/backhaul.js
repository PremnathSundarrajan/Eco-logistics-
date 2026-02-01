const express = require('express');
const router = express.Router();
const backhaulController = require('../controllers/backhaulController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/opportunities', backhaulController.getOpportunities);

module.exports = router;
