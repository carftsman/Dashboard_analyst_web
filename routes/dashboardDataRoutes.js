const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const uploadController = require('../controllers/uploadController');
/**
 * @swagger
 * /api/dashboard-data/{dashboardId}:
 *   get:
 *     summary: Get dynamic dashboard charts
 *     description: Returns dashboard charts using latest or selected file. Supports filters and file selection.
 *     tags: [Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: fileId
 *         required: false
 *         schema:
 *           type: string
 *         example: "uuid-file-id"
 *       - in: query
 *         name: platform
 *         required: false
 *         schema:
 *           type: string
 *         example: "Google"
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Chart data
 *         content:
 *           application/json:
 *             example:
 *               dashboardId: 1
 *               fileId: "uuid-file-id"
 *               charts:
 *                 - type: bar
 *                   data:
 *                     - name: Campaign A
 *                       value: 5000
 *       404:
 *         description: Dashboard not found
 *       500:
 *         description: Server error
 */
router.get('/dashboard-data/:dashboardId', verifyToken, uploadController.getDashboardData);
module.exports = router;