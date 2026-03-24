const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Dashboards
 *   description: Dashboard Management APIs
 */

/**
 * @swagger
 * /api/dashboards:
 *   post:
 *     summary: Create dashboard (Admin only)
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: ROI Dashboard
 *               description:
 *                 type: string
 *                 example: Marketing performance dashboard
 *               image:
 *                 type: string
 *                 example: https://image-url.com/dashboard.png
 *     responses:
 *       200:
 *         description: Dashboard created successfully
 *       403:
 *         description: Only admin can create dashboards
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  verifyToken,
  authorizeRoles('ADMIN'),
  dashboardController.createDashboard
);

/**
 * @swagger
 * /api/dashboards/{id}/columns:
 *   post:
 *     summary: Add columns to dashboard
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               columns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     columnKey:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     dataType:
 *                       type: string
 *                       enum: [STRING, NUMBER, DATE]
 *                     required:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Columns added successfully
 */
router.post(
  '/:id/columns',
  verifyToken,
  authorizeRoles('ADMIN'),
  dashboardController.addColumns
);
/**
 * @swagger
 * /api/dashboards/{id}/columns:
 *   get:
 *     summary: Get columns for dashboard (used in chart creation)
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of columns
 */
router.get(
  '/:id/columns',
  verifyToken,
  dashboardController.getColumns
);
/**
 * @swagger
 * /api/dashboards/{id}/widgets:
 *   post:
 *     summary: Add charts/widgets to dashboard
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               widgets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: bar
 *                     title:
 *                       type: string
 *                       example: Sales Chart
 *                     xAxis:
 *                       type: string
 *                       example: date
 *                     yAxis:
 *                       type: string
 *                       example: revenue
 *     responses:
 *       200:
 *         description: Widgets added successfully
 */
router.post(
  '/:id/widgets',
  verifyToken,
  authorizeRoles('ADMIN'),
  dashboardController.addWidgets
);
//////////////////////////////////////////////////////
// 📄 GET ALL DASHBOARDS
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/dashboards:
 *   get:
 *     summary: Get all dashboards
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dashboards
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  verifyToken,
  dashboardController.getDashboards
);

//////////////////////////////////////////////////////
// 📄 GET SINGLE DASHBOARD
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/dashboards/{id}:
 *   get:
 *     summary: Get dashboard by ID
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Dashboard details
 *       404:
 *         description: Dashboard not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  verifyToken,
  dashboardController.getDashboardById
);

//////////////////////////////////////////////////////
// ❌ DELETE DASHBOARD
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/dashboards/{id}:
 *   delete:
 *     summary: Delete dashboard (Admin only)
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Dashboard deleted successfully
 *       403:
 *         description: Only admin can delete dashboards
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('ADMIN'),
  dashboardController.deleteDashboard
);

module.exports = router;