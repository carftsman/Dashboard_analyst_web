const express = require('express');
const router = express.Router();

const chartController = require('../controllers/chartController');

const { verifyToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Charts
 *   description: Chart Configuration APIs
 */

/**
 * @swagger
 * /api/chart-types/config:
 *   get:
 *     summary: Get chart types with required configuration fields
 *     description: Returns list of supported chart types along with required fields like xAxis, yAxis, metrics etc. Used for dynamic chart builder UI.
 *     tags: [Charts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chart types fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               total: 20
 *               charts:
 *                 - type: BAR
 *                   title: Bar Chart
 *                   requiredFields: [xAxis, yAxis]
 *                   fields:
 *                     xAxis:
 *                       type: string
 *                     yAxis:
 *                       type: number
 *       401:
 *         description: Unauthorized (Invalid or missing token)
 *       500:
 *         description: Server error
 */
router.get('/chart-types/config', verifyToken, chartController.getChartTypesConfig);

module.exports = router;