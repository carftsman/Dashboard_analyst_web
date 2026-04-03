const express = require('express');
const router = express.Router();

const widgetController = require('../controllers/widgetController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Widgets
 *   description: Dashboard Widget Management APIs
 */

/**
 * @swagger
 * /api/widgets/custom:
 *   post:
 *     summary: Save or replace user custom chart
 *     description: >
 *       Allows user to override default widget or create new custom widget.
 *       Custom widgets are saved per file (fileId required).
 *     tags: [Widgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             dashboardId: 1
 *             fileId: "uuid-file-id"   # 🔥 REQUIRED (NEW FIX)
 *             name: "Revenue by Campaign"
 *             type: "PIE"
 *             replaceWidgetId: 12
 *             config:
 *               xAxis: ["campaign_name"]
 *               yAxis: ["revenue"]
 *     responses:
 *       200:
 *         description: Custom widget saved or replaced successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  '/custom',
  verifyToken,
  authorizeRoles("ANALYST", "SUBUSER"),
  widgetController.saveUserWidget
);

//////////////////////////////////////////////////////
// 📊 GET DASHBOARD WIDGETS (WITH USER OVERRIDES)
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/widgets/{dashboardId}:
 *   get:
 *     summary: Get dashboard widgets (default + user customized)
 *     tags: [Widgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: List of widgets with user overrides applied
 *         content:
 *           application/json:
 *             example:
 *               dashboardId: 1
 *               isCustom: true
 *               widgets: []
 */
router.get(
  '/:dashboardId',
  verifyToken,
  authorizeRoles("ANALYST", "SUBUSER"),
  widgetController.getWidgets
);
/**
 * @swagger
 * /api/widgets/{widgetId}:
 *   put:
 *     summary: Update widget (user only OR create override)
 *     description: 
 *       - If user owns widget → update
 *       - If admin widget → create override (admin not affected)
 *     tags: [Widgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: widgetId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 38
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "Revenue by Campaign"
 *             type: "BAR"
 *             config:
 *               xAxis: ["campaign_name"]
 *               yAxis: ["revenue"]
 *     responses:
 *       200:
 *         description: Widget updated or overridden
 */
router.put(
  '/:widgetId',
  verifyToken,
  authorizeRoles("ANALYST", "SUBUSER"),
  widgetController.updateWidget
);
module.exports = router;