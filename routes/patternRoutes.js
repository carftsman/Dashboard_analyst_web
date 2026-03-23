const express = require('express');
const router = express.Router();
const patternController = require('../controllers/patternController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/:dashboardId/patterns', verifyToken, patternController.getDashboardPatterns);

module.exports = router;