const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const uploadController = require('../controllers/uploadController');
const reportController = require('../controllers/reportController');
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
/**
 * @swagger
 * /api/save-summary:
 *   post:
 *     summary: Save Dashboard Report Summary
 *     description: Saves report summary entered by the user for a dashboard.
 *     tags: [Dashboard Reports]
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
 *               - fileId
 *               - reportSummary
 *             properties:
 *               dashboardId:
 *                 type: integer
 *                 example: 29
 *               fileId:
 *                 type: string
 *                 example: "f8c7e9d2-1234-5678-9999"
 *               reportSummary:
 *                 type: string
 *                 example: "Revenue increased by 18% compared to last month."
 *     responses:
 *       200:
 *         description: Summary saved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Summary saved successfully"
 *               reportId: "3d8e7b1a-1234-5678-9999"
 *       500:
 *         description: Server error
 */
router.post(
  "/save-summary",
  verifyToken,
  reportController.saveReportSummary
);
/**
 * @swagger
 * /api/summary:
 *   patch:
 *     summary: Update Dashboard Report Summary
 *     description: Updates an existing report summary using fileId.
 *     tags: [Dashboard Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileId
 *               - reportSummary
 *             properties:
 *               fileId:
 *                 type: string
 *                 example: "f8c7e9d2-1234-5678-9999"
 *               reportSummary:
 *                 type: string
 *                 example: "Updated revenue analysis for June. South region contributed the highest sales."
 *     responses:
 *       200:
 *         description: Summary updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Summary updated successfully"
 *               report:
 *                 id: "3d8e7b1a-1234-5678-9999"
 *                 fileId: "f8c7e9d2-1234-5678-9999"
 *                 reportSummary: "Updated revenue analysis for June. South region contributed the highest sales."
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Report not found"
 *       500:
 *         description: Server error
 */
router.patch(
  "/summary",
  verifyToken,
  reportController.updateReportSummary
);
/**
 * @swagger
 * /api/summary/{fileId}:
 *   get:
 *     summary: Get Report Summary
 *     tags: [Dashboard Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         example: "c8f3c6c8-1234-5678-abcd"
 *     responses:
 *       200:
 *         description: Report summary fetched successfully
 */
router.get(
  "/summary/:fileId",
  verifyToken,
  reportController.getReportSummary
);
module.exports = router;