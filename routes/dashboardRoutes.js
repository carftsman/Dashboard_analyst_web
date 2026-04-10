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
authorizeRoles('SUPER_ADMIN', 'ADMIN'),  dashboardController.createDashboard
);
/**
 * @swagger
 * /api/dashboards/{id}:
 *   put:
 *     summary: Update dashboard (Admin only)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Dashboard Name
 *               description:
 *                 type: string
 *                 example: Updated description
 *               image:
 *                 type: string
 *                 example: https://image-url.com/dashboard.png
 *     responses:
 *       200:
 *         description: Dashboard updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Dashboard updated successfully
 *               dashboard:
 *                 id: 1
 *                 name: Updated Dashboard Name
 *                 description: Updated description
 *       403:
 *         description: Only admin can update
 *       404:
 *         description: Dashboard not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  verifyToken,
authorizeRoles('SUPER_ADMIN', 'ADMIN'),  dashboardController.updateDashboard
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
authorizeRoles('SUPER_ADMIN', 'ADMIN'),  dashboardController.addColumns
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
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  dashboardController.addWidgets
);
/**
 * @swagger
 * /api/dashboards/{id}/widgets:
 *   get:
 *     summary: Get all charts (widgets) for a dashboard
 *     tags: [Dashboards]
 *     description: Fetch all widgets/charts associated with a dashboard
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
 *         description: Charts fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               dashboardId: 1
 *               total: 2
 *               charts:
 *                 - id: 10
 *                   name: Revenue Chart
 *                   type: BAR
 *                   config:
 *                     groupBy: campaign_name
 *                     metrics: ["revenue"]
 *                 - id: 11
 *                   name: Platform Split
 *                   type: PIE
 *                   config:
 *                     groupBy: platform
 *                     metrics: ["revenue"]
 *       404:
 *         description: Dashboard not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id/widgets',
  verifyToken,
  dashboardController.getWidgets
);
/**
 * @swagger
 * /api/dashboards/{id}/widgets/{widgetId}:
 *   put:
 *     summary: Update widget/chart configuration
 *     tags: [Dashboards]
 *     description: Edit chart type, name, or config dynamically
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: widgetId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Revenue Chart
 *               type:
 *                 type: string
 *                 example: BAR
 *               config:
 *                 type: object
 *                 example:
 *                   xAxis: campaign_name
 *                   metrics: ["revenue"]
 *     responses:
 *       200:
 *         description: Widget updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Widget updated successfully
 *               widget:
 *                 id: 10
 *                 name: Revenue Chart
 *                 type: BAR
 *       404:
 *         description: Widget not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/widgets/:widgetId',
  verifyToken,
  dashboardController.updateWidget
);
/**
 * @swagger
 * /api/dashboards/{id}/widgets/{widgetId}:
 *   delete:
 *     summary: Delete widget/chart
 *     tags: [Dashboards]
 *     description: Remove a chart from dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: widgetId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: Widget deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Widget deleted successfully
 *       404:
 *         description: Widget not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id/widgets/:widgetId',
  verifyToken,
  dashboardController.deleteWidget
);
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
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  dashboardController.deleteDashboard
);
/**
 * @swagger
 * /api/dashboards/{id}/columns/{columnId}:
 *   put:
 *     summary: Update a column in dashboard schema
 *     description: Allows admin to edit column name, type, and required flag
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
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               columnKey:
 *                 type: string
 *                 example: campaign_name
 *               displayName:
 *                 type: string
 *                 example: Campaign Name
 *               dataType:
 *                 type: string
 *                 enum: [STRING, NUMBER, DATE]
 *                 example: STRING
 *               required:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Column updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Column updated
 *               column:
 *                 id: 5
 *                 columnKey: campaign_name
 *                 displayName: Campaign Name
 *                 dataType: STRING
 *                 required: true
 *       404:
 *         description: Column not found
 *       403:
 *         description: Only admin can update columns
 *       500:
 *         description: Server error
 */
router.put('/:id/columns/:columnId', verifyToken, authorizeRoles('SUPER_ADMIN', 'ADMIN'), dashboardController.updateColumn);
/**
 * @swagger
 * /api/dashboards/{id}/columns/{columnId}:
 *   delete:
 *     summary: Delete a column from dashboard schema
 *     description: Deletes a column if it is not used in any widget
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
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     responses:
 *       200:
 *         description: Column deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Column deleted successfully
 *       400:
 *         description: Column is used in widgets
 *         content:
 *           application/json:
 *             example:
 *               message: Column "campaign_name" is used in widgets. Remove widget first.
 *       404:
 *         description: Column not found
 *       403:
 *         description: Only admin can delete columns
 *       500:
 *         description: Server error
 */
router.delete('/:id/columns/:columnId', verifyToken, authorizeRoles('SUPER_ADMIN', 'ADMIN'), dashboardController.deleteColumn);
module.exports = router;