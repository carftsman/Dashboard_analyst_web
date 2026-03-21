const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');


/**
 * @swagger
 * /api/admin/dashboard:
 *   post:
 *     summary: Create a new dashboard
 *     description: Allows an authenticated user (Admin/Manager/Analyst) to create a new dashboard with name, category, and description.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
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
 *                 enum: [SALES, MARKETING, SUPPLY_CHAIN, FINANCE, HR, OPERATIONS, CUSTOM]
 *                 example: SALES
 *               description:
 *                 type: string
 *                 example: Dashboard for tracking sales performance
 *     responses:
 *       201:
 *         description: Dashboard created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Dashboard created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     dashboardId:
 *                       type: integer
 *                       example: 1
 *                     dashboardName:
 *                       type: string
 *                       example: Sales Dashboard
 *                     category:
 *                       type: string
 *                       example: SALES
 *                     description:
 *                       type: string
 *                       nullable: true
 *                       example: Dashboard for tracking sales performance
 *                     status:
 *                       type: string
 *                       example: ACTIVE
 *                     createdById:
 *                       type: integer
 *                       example: 2
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-03-20T10:30:00.000Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-03-20T10:30:00.000Z
 *       500:
 *         description: Create dashboard failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Create dashboard failed
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.post('/dashboard', verifyToken, dashboardController.createDashboard);

/**
 * @swagger
 * /api/admin/get_dashboards:
 *   get:
 *     summary: Get all dashboards
 *     description: Fetch all dashboards ordered by latest created first.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboards fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Dashboards fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       dashboardId:
 *                         type: integer
 *                         example: 1
 *                       dashboardName:
 *                         type: string
 *                         example: Sales Dashboard
 *                       category:
 *                         type: string
 *                         example: SALES
 *                       description:
 *                         type: string
 *                         example: Dashboard for sales analytics
 *                       status:
 *                         type: string
 *                         example: ACTIVE
 *                       createdById:
 *                         type: integer
 *                         example: 2
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-03-20T10:30:00.000Z
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-03-20T11:00:00.000Z
 *       500:
 *         description: Fetch dashboards failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Fetch dashboards failed
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/get_dashboards', dashboardController.getDashboards);

router.get('/:id', dashboardController.getDashboardById);
router.put('/:id', dashboardController.updateDashboard);
router.delete('/:id', dashboardController.deleteDashboard);

module.exports = router;