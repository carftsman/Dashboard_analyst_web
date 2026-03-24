const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');
/**
 * @swagger
 * /api/export:
 *   post:
 *     summary: Export filtered data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             dashboardId: 1
 *             fileId: "uuid-file-id"
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       500:
 *         description: Server error
 */
router.post('/export', verifyToken, reportController.exportData);

//////////////////////////////////////////////////////
// 📜 REPORT HISTORY
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/reports/{dashboardId}:
 *   get:
 *     summary: Get report history
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Reports fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 dashboardId: 1
 *                 createdAt: "2026-03-21T10:00:00Z"
 *       500:
 *         description: Server error
 */
router.get('/reports/:dashboardId', verifyToken, reportController.getReports);

/**
 * @swagger
 * /api/dashboard/pdf:
 *   get:
 *     summary: Download dashboard as PDF
 *     description: Generates PDF of dashboard charts and visualizations
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         example: "uuid-file-id"
 *     responses:
 *       200:
 *         description: PDF downloaded successfully
 *       500:
 *         description: Server error
 */
router.get('/dashboard/pdf', verifyToken, reportController.exportDashboardPDF);
module.exports = router;