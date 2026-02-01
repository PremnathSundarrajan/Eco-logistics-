const express = require('express');
const router = express.Router();
const synergyController = require('../controllers/synergyController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/search/:truckId', synergyController.searchSynergy);
router.post('/merge', synergyController.confirmMerge);

module.exports = router;
