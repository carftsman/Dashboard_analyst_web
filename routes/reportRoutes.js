const express = require('express');
const router = express.Router();

const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

const multer = require("multer"); // ✅ ADD HERE


// ✅ MEMORY STORAGE (for PDF upload)
const upload = multer({
  storage: multer.memoryStorage()
});
/**
 * @swagger
 * /api/reports/upload:
 *   post:
 *     summary: Upload frontend generated PDF report
 *     description: >
 *       Accepts a PDF file generated from frontend (html2canvas/jsPDF),
 *       uploads it to Azure Blob Storage, and saves report metadata in database.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - dashboardId
 *               - fileId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file generated from frontend
 *               name:
 *                 type: string
 *                 example: "My Dashboard Report"
 *               dashboardId:
 *                 type: integer
 *                 example: 1
 *               fileId:
 *                 type: string
 *                 example: "uuid-file-id"
 *     responses:
 *       200:
 *         description: Report uploaded and saved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Frontend PDF uploaded successfully"
 *               fileUrl: "https://azure-url/report.pdf"
 *               report:
 *                 id: "uuid"
 *                 name: "My Dashboard Report"
 *                 dashboardId: 1
 *                 fileId: "uuid-file-id"
 *                 fileUrl: "https://azure-url/report.pdf"
 *       400:
 *         description: Missing file or invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/upload",
  verifyToken,
  upload.single("file"), // ✅ VERY IMPORTANT
  reportController.uploadFrontendPDF
);

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

/**
 * @swagger
 * /api/reports/dashboard/pdf:
 *   post:
 *     summary: Generate dashboard PDF
 *     description: >
 *       Generates PDF from dashboard charts, uploads to Azure,
 *       and saves report in database.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             basic:
 *               summary: Generate PDF
 *               value:
 *                 name: "March Campaign Report"
 *                 dashboardId: 1
 *                 fileId: "uuid-file-id"
 *             withWidgets:
 *               summary: Custom widgets
 *               value:
 *                 name: "Custom Report"
 *                 dashboardId: 1
 *                 fileId: "uuid-file-id"
 *                 widgets:
 *                   - name: "Revenue"
 *                     type: "BAR"
 *                     xAxis: "campaign"
 *                     yAxis: "revenue"
 *             fromSavedReport:
 *               summary: Use saved report
 *               value:
 *                 reportId: "uuid-report-id"
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "PDF generated successfully"
 *               fileUrl: "https://azure-url/report.pdf"
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post("/dashboard/pdf", verifyToken, reportController.exportDashboardPDF);
/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: User Custom Report APIs (Does NOT affect dashboard template)
 */

//////////////////////////////////////////////////////
// 🔍 PREVIEW REPORT (WITHOUT SAVING)
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/reports/preview:
 *   post:
 *     summary: Preview report with custom widgets (no DB save)
 *     description: Generates charts based on user-modified widgets without affecting dashboard template
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
 *             widgets:
 *               - name: "Revenue by Campaign"
 *                 type: "BAR"
 *                 xAxis: "campaign_name"
 *                 yAxis: "revenue"
 *               - name: "Trend"
 *                 type: "LINE"
 *                 xAxis: "date"
 *                 yAxis: "revenue"
 *     responses:
 *       200:
 *         description: Preview charts generated successfully
 *         content:
 *           application/json:
 *             example:
 *               charts:
 *                 - type: "bar"
 *                   title: "Revenue by Campaign"
 *                   data:
 *                     - name: "Campaign A"
 *                       value: 5000
 *                 - type: "line"
 *                   data:
 *                     - x: "2024-01-01"
 *                       revenue: 1000
 *       500:
 *         description: Server error
 */
router.post('/preview', verifyToken, reportController.generateReportPreview);

//////////////////////////////////////////////////////
// 💾 SAVE REPORT
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/reports/save:
 *   post:
 *     summary: Save user customized report
 *     description: Stores user-modified widgets as a report without changing dashboard template
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "My Custom ROI Report"
 *             dashboardId: 1
 *             fileId: "uuid-file-id"
 *             widgets:
 *               - name: "Revenue by Campaign"
 *                 type: "BAR"
 *                 xAxis: "campaign_name"
 *                 yAxis: "revenue"
 *     responses:
 *       200:
 *         description: Report saved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Report saved"
 *               reportId: "uuid-report-id"
 *       500:
 *         description: Server error
 */
router.post('/save', verifyToken, reportController.saveReport);
/**
 * @swagger
 * /api/reports/all:
 *   get:
 *     summary: Get all reports (Admin)
 *     description: Returns all reports with dashboard name, report name, URL, user, and date
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports fetched successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get(
  "/all",
  verifyToken,
  authorizeRoles("ADMIN"),
  reportController.getAllReports
);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get logged-in user's reports
 *     description: Returns reports ONLY for selected dashboard
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dashboardId
 *         required: true   # ✅ CHANGE THIS
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Dashboard ID (required)
 *     responses:
 *       200:
 *         description: Reports fetched successfully
 *       400:
 *         description: dashboardId is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", verifyToken, reportController.getMyReports);

//////////////////////////////////////////////////////
// 📄 GET REPORT BY ID
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/reports/{reportId}:
 *   get:
 *     summary: Get report by ID
 *     description: Fetch a specific report with configuration and snapshot
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         example: "uuid-report-id"
 *     responses:
 *       200:
 *         description: Report fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               id: "uuid-report-id"
 *               name: "March Campaign Report"
 *               fileUrl: "https://azure-url/report.pdf"
 *               dashboardId: 1
 *               fileId: "uuid-file-id"
 *               config: []
 *               snapshot: []
 *               createdAt: "2026-03-25T10:00:00Z"
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.get("/:reportId", verifyToken, reportController.getReport);


/**
 * @swagger
 * /api/reports/{reportId}:
 *   delete:
 *     summary: Delete a report
 *     description: Deletes a saved report from database
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         example: "uuid-report-id"
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Deleted"
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */
router.delete("/:reportId", verifyToken, reportController.deleteReport);
module.exports = router;