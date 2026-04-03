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
 *     tags: [Dashboard Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 29
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
 *         name: campaign_name
 *         required: false
 *         schema:
 *           type: string
 *         example: "Campaign A"
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
 *         description: Chart data with filters applied
 *         content:
 *           application/json:
 *             example:
 *               dashboardId: 29
 *               fileId: "uuid-file-id"
 *               charts:
 *                 - name: "Sales by Campaign"
 *                   type: bar
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