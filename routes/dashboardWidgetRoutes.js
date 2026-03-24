const express = require('express');
const router = express.Router();
const dashboardWidgetController = require('../controllers/dashboardWidgetController');
/**
 * @swagger
 * /api/dashboard/{dashboardId}/widget-builder:
 *   get:
 *     summary: Get widget builder data for a dashboard
 *     description: Returns dashboard details, active schema columns, and available widget definitions for building widgets.
 *     tags:
 *       - Dashboard Widgets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Widget builder fetched successfully
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
 *                   example: Widget builder fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     dashboardId:
 *                       type: integer
 *                       example: 1
 *                     dashboardName:
 *                       type: string
 *                       example: Sales Dashboard
 *                     columns:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           columnName:
 *                             type: string
 *                             example: Revenue From Vendors
 *                           dataType:
 *                             type: string
 *                             example: NUMBER
 *                           isRequired:
 *                             type: boolean
 *                             example: true
 *                     widgets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           widgetType:
 *                             type: string
 *                             example: BAR_CHART
 *                           displayName:
 *                             type: string
 *                             example: Bar Chart
 *                           inputs:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 field:
 *                                   type: string
 *                                   example: xAxis
 *                                 label:
 *                                   type: string
 *                                   example: X-Axis Column
 *                                 type:
 *                                   type: string
 *                                   example: column
 *                                 required:
 *                                   type: boolean
 *                                   example: true
 *       400:
 *         description: Invalid dashboard id
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
 *                   example: Invalid dashboard id
 *       404:
 *         description: Dashboard not found
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
 *                   example: Dashboard not found
 *       500:
 *         description: Fetch widget builder failed
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
 *                   example: Fetch widget builder failed
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/:dashboardId/widget-builder', dashboardWidgetController.getWidgetBuilder);
/**
 * @swagger
 * /api/dashboard/{dashboardId}/widget:
 *   post:
 *     summary: Create a new widget
 *     description: Creates a widget for a specific dashboard with given configuration and layout details.
 *     tags:
 *       - Dashboard Widgets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - widgetType
 *               - config
 *             properties:
 *               title:
 *                 type: string
 *                 example: Revenue by Executive
 *               widgetType:
 *                 type: string
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
 *               config:
 *                 type: object
 *                 description: Dynamic configuration based on widget type
 *                 example:
 *                   xAxis: Executive Name
 *                   yAxis: Revenue From Vendors
 *                   groupBy: Executive Name
 *                   filters:
 *                     Month: January
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
 *                       example: 3
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
 *                     config:
 *                       type: object
 *                       example:
 *                         xAxis: Executive Name
 *                         yAxis: Revenue From Vendors
 *                         groupBy: Executive Name
 *                         filters:
 *                           Month: January
 *       400:
 *         description: Bad request (validation errors)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               examples:
 *                 invalidDashboard:
 *                   value:
 *                     success: false
 *                     message: Invalid dashboard id
 *                 missingFields:
 *                   value:
 *                     success: false
 *                     message: title and widgetType are required
 *                 invalidType:
 *                   value:
 *                     success: false
 *                     message: Invalid widget type
 *                 configMissing:
 *                   value:
 *                     success: false
 *                     message: config is required
 *                 fieldMissing:
 *                   value:
 *                     success: false
 *                     message: xAxis is required for BAR_CHART
 *       404:
 *         description: Dashboard not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: Dashboard not found
 *       500:
 *         description: Create widget failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: Create widget failed
 *                 error: Internal server error
 */
router.post('/:dashboardId/widget', dashboardWidgetController.createWidget);
/**
 * @swagger
 * /api/dashboard/widget/{id}/chart-data:
 *   get:
 *     summary: Get widget chart data
 *     description: Returns processed chart or table data for a widget based on its type and configuration.
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
 *           example: 3
 *     responses:
 *       200:
 *         description: Widget data fetched successfully
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
 *             examples:
 *               barChart:
 *                 summary: BAR_CHART or LINE_CHART response
 *                 value:
 *                   success: true
 *                   message: Chart data fetched successfully
 *                   data:
 *                     widgetId: 3
 *                     title: Revenue by Executive
 *                     widgetType: BAR_CHART
 *                     xAxis: Executive Name
 *                     yAxis: Revenue From Vendors
 *                     values:
 *                       - label: Ravi
 *                         value: 20000
 *                       - label: Sita
 *                         value: 15000
 *               pieChart:
 *                 summary: PIE_CHART response
 *                 value:
 *                   success: true
 *                   message: Chart data fetched successfully
 *                   data:
 *                     widgetId: 4
 *                     title: Revenue by Region
 *                     widgetType: PIE_CHART
 *                     groupBy: Region
 *                     metric: Revenue From Vendors
 *                     values:
 *                       - label: South
 *                         value: 50000
 *                       - label: North
 *                         value: 30000
 *               kpiCards:
 *                 summary: KPI_CARDS response
 *                 value:
 *                   success: true
 *                   message: KPI data fetched successfully
 *                   data:
 *                     widgetId: 5
 *                     title: Total Revenue
 *                     widgetType: KPI_CARDS
 *                     metric: Revenue From Vendors
 *                     value: 80000
 *               table:
 *                 summary: TABLE response
 *                 value:
 *                   success: true
 *                   message: Table data fetched successfully
 *                   data:
 *                     widgetId: 6
 *                     title: Executive Summary
 *                     widgetType: TABLE
 *                     columns:
 *                       - Executive Name
 *                       - Region
 *                       - Revenue From Vendors
 *                     values:
 *                       - Executive Name: Ravi
 *                         Region: South
 *                         Revenue From Vendors: 20000
 *                       - Executive Name: Sita
 *                         Region: North
 *                         Revenue From Vendors: 15000
 *       400:
 *         description: Invalid widget id, missing config, or widget type not supported
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
 *             examples:
 *               invalidWidgetId:
 *                 summary: Invalid widget id
 *                 value:
 *                   success: false
 *                   message: Invalid widget id
 *               missingBarConfig:
 *                 summary: Missing xAxis or yAxis
 *                 value:
 *                   success: false
 *                   message: Widget config is missing xAxis or yAxis
 *               missingPieConfig:
 *                 summary: Missing groupBy or metric
 *                 value:
 *                   success: false
 *                   message: Widget config is missing groupBy or metric
 *               missingKpiMetric:
 *                 summary: Missing KPI metric
 *                 value:
 *                   success: false
 *                   message: Widget config is missing metric
 *               notImplemented:
 *                 summary: Widget type not implemented
 *                 value:
 *                   success: false
 *                   message: Chart data handler not implemented for MAP_CHART
 *       404:
 *         description: Widget or linked file not found
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
 *             examples:
 *               widgetNotFound:
 *                 summary: Widget not found
 *                 value:
 *                   success: false
 *                   message: Widget not found
 *               fileNotLinked:
 *                 summary: File not linked to widget
 *                 value:
 *                   success: false
 *                   message: File not linked to this widget
 *       500:
 *         description: Fetch chart data failed
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
 *                   example: Fetch chart data failed
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/widget/:id/chart-data', dashboardWidgetController.getWidgetChartData);

module.exports = router;