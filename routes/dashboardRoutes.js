const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');


/**
 * @swagger
 * /api/admin/dashboard:
 *   post:
 *     summary: Create Dashboard
 *     tags: [Dashboard]
 *     description: Create a new dashboard for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dashboardName
 *               - category
 *             properties:
 *               dashboardName:
 *                 type: string
 *                 example: Sales Dashboard
 *               category:
 *                 type: string
 *                 example: Finance
 *               description:
 *                 type: string
 *                 example: Dashboard for tracking monthly sales performance
 *     responses:
 *       201:
 *         description: Dashboard created successfully
 *       401:
 *         description: Authorization token is required or invalid/expired token
 *       500:
 *         description: Create dashboard failed
 */
router.post('/dashboard', verifyToken, dashboardController.createDashboard);

/**
 * @swagger
 * /api/admin/get_dashboards:
 *   get:
 *     summary: Get All Dashboards
 *     tags: [Dashboard]
 *     description: Fetch all dashboards sorted by latest created
 *     responses:
 *       200:
 *         description: Dashboards fetched successfully
 *       500:
 *         description: Fetch dashboards failed
 */
router.get('/get_dashboards', dashboardController.getDashboards);

router.get('/:id', dashboardController.getDashboardById);
router.put('/:id', dashboardController.updateDashboard);
router.delete('/:id', dashboardController.deleteDashboard);

module.exports = router;