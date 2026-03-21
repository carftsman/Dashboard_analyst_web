const express = require('express');
const router = express.Router();

const dashboardWidgetController = require('../controllers/dashboardWidgetController');
const { verifyToken } = require('../middleware/authMiddleware');
/**
 * @swagger
 * /api/dashboard/widget:
 *   post:
 *     summary: Create a dashboard widget
 *     description: Create a new widget for a dashboard using uploaded file data. Supports configuration for chart axes, grouping, and filters.
 *     tags:
 *       - Dashboard Widgets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dashboardId
 *               - title
 *               - widgetType
 *               - fileId
 *             properties:
 *               dashboardId:
 *                 type: integer
 *                 example: 1
 *               title:
 *                 type: string
 *                 example: Revenue by Executive
 *               widgetType:
 *                 type: string
 *                 enum:
 *                   - KPI_CARDS
 *                   - BAR_CHART
 *                   - PIE_CHART
 *                   - LINE_CHART
 *                   - GAUGE_CHART
 *                   - MAP_CHART
 *                   - STACKED_CHART
 *                   - SCATTER_PLOT
 *                   - TABLE
 *                 example: BAR_CHART
 *               positionX:
 *                 type: integer
 *                 example: 0
 *               positionY:
 *                 type: integer
 *                 example: 0
 *               width:
 *                 type: integer
 *                 example: 6
 *               height:
 *                 type: integer
 *                 example: 4
 *               fileId:
 *                 type: integer
 *                 example: 5
 *               xAxis:
 *                 type: string
 *                 example: Executive Name
 *               yAxis:
 *                 type: string
 *                 example: Revenue From Vendors
 *               groupBy:
 *                 type: string
 *                 example: Executive Name
 *               filters:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 example:
 *                   Month: January
 *                   Region: South
 *     responses:
 *       201:
 *         description: Widget created successfully
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
 *                   example: Widget created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 10
 *                     dashboardId:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: Revenue by Executive
 *                     widgetType:
 *                       type: string
 *                       example: BAR_CHART
 *                     positionX:
 *                       type: integer
 *                       example: 0
 *                     positionY:
 *                       type: integer
 *                       example: 0
 *                     width:
 *                       type: integer
 *                       example: 6
 *                     height:
 *                       type: integer
 *                       example: 4
 *                     fileId:
 *                       type: integer
 *                       example: 5
 *                     config:
 *                       type: object
 *                       example:
 *                         xAxis: Executive Name
 *                         yAxis: Revenue From Vendors
 *                         groupBy: Executive Name
 *                         filters:
 *                           Month: January
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-03-21T10:30:00.000Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-03-21T10:30:00.000Z
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: dashboardId, title, widgetType and fileId are required
 *       404:
 *         description: Dashboard or uploaded file not found
 *         content:
 *           application/json:
 *             examples:
 *               dashboardNotFound:
 *                 value:
 *                   success: false
 *                   message: Dashboard not found
 *               fileNotFound:
 *                 value:
 *                   success: false
 *                   message: Uploaded file not found
 *       500:
 *         description: Internal server error while creating widget
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Create widget failed
 *               error: Internal server error
 */
router.post(
  '/widget',
  verifyToken,
  dashboardWidgetController.createWidget
);
/**
 * @swagger
 * api/dashboard/widget/{id}/chart-data:
 *   get:
 *     summary: Get widget chart data
 *     description: Fetch processed chart data for a widget by using the linked uploaded file rows, widget configuration, grouping, and filters.
 *     tags:
 *       - Dashboard Widgets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Widget ID
 *         schema:
 *           type: integer
 *         example: 3
 *     responses:
 *       200:
 *         description: Chart data fetched successfully
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
 *                   example: Chart data fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     widgetId:
 *                       type: integer
 *                       example: 3
 *                     title:
 *                       type: string
 *                       example: Revenue by Executive
 *                     widgetType:
 *                       type: string
 *                       example: BAR_CHART
 *                     xAxis:
 *                       type: string
 *                       example: Executive Name
 *                     yAxis:
 *                       type: string
 *                       example: Revenue From Vendors
 *                     groupBy:
 *                       type: string
 *                       example: Executive Name
 *                     values:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                             example: Ravi
 *                           value:
 *                             type: number
 *                             example: 20000
 *       400:
 *         description: Invalid widget ID
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Invalid widget id
 *       404:
 *         description: Widget or linked file not found
 *         content:
 *           application/json:
 *             examples:
 *               widgetNotFound:
 *                 value:
 *                   success: false
 *                   message: Widget not found
 *               fileNotLinked:
 *                 value:
 *                   success: false
 *                   message: File not linked to this widget
 *       500:
 *         description: Internal server error while fetching chart data
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Fetch chart data failed
 *               error: Internal server error
 */
router.get(
  '/widget/:id/chart-data',
  verifyToken,
  dashboardWidgetController.getWidgetChartData
);

module.exports = router;