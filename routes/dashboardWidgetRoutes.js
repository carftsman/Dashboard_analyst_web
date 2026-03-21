const express = require('express');
const router = express.Router();

const dashboardWidgetController = require('../controllers/dashboardWidgetController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post(
  '/widget',
  verifyToken,
  dashboardWidgetController.createWidget
);
router.get(
  '/widget/:id/chart-data',
  verifyToken,
  dashboardWidgetController.getWidgetChartData
);

module.exports = router;