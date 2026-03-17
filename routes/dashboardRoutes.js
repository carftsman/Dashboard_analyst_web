const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.post('/', dashboardController.createDashboard);
router.get('/', dashboardController.getDashboards);
router.get('/:id', dashboardController.getDashboardById);
router.put('/:id', dashboardController.updateDashboard);
router.delete('/:id', dashboardController.deleteDashboard);

module.exports = router;