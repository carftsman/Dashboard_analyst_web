const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/dashboard',verifyToken, dashboardController.createDashboard);
router.get('/get_dashboards', dashboardController.getDashboards);
router.get('/:id', dashboardController.getDashboardById);
router.put('/:id', dashboardController.updateDashboard);
router.delete('/:id', dashboardController.deleteDashboard);

module.exports = router;