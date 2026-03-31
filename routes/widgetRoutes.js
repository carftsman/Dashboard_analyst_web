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


//////////////////////////////////////////////////////
// 💾 SAVE CUSTOM WIDGET
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/widgets/custom:
 *   post:
 *     summary: Save user custom chart
 *     tags: [Widgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             dashboardId: 1
 *             name: "Revenue by Campaign"
 *             type: "BAR"
 *             config:
 *               xAxis: "campaign_name"
 *               yAxis: "revenue"
 *     responses:
 *       200:
 *         description: Custom widget saved
 *         content:
 *           application/json:
 *             example:
 *               message: Custom chart saved
 *       500:
 *         description: Server error
 */
router.post('/custom', verifyToken,authorizeRoles("ANALYST", "SUBUSER"), widgetController.saveUserWidget);

/**
 * @swagger
 * /api/widgets/{dashboardId}:
 *   get:
 *     summary: Get widgets by dashboard
 *     tags: [Widgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of widgets
 */
router.get('/:dashboardId', verifyToken,authorizeRoles("ANALYST", "SUBUSER"), widgetController.getWidgets);

module.exports = router;