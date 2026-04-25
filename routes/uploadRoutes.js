const express = require('express');
const router = express.Router();

const uploadController = require('../controllers/uploadController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadExcel, cleanupFile } = require('../middleware/uploadExcelMiddleware');

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File Upload, Mapping, Validation APIs
 */

/**
 * @swagger
 * /api/upload/upload:
 *   post:
 *     summary: Upload Excel or CSV file
 *     description: Upload dataset and extract columns for mapping
 *     tags: [Upload]
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
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Upload CSV or Excel file
 *               dashboardId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             example:
 *               message: File uploaded
 *               fileId: "uuid"
 *               extractedColumns:
 *                 - campaign_name
 *                 - revenue
 *                 - clicks
 *               sampleData:
 *                 - campaign_name: "Campaign A"
 *                   revenue: 1000
 *                   clicks: 200
 *       400:
 *         description: Invalid file or empty file
 *       500:
 *         description: Server error
 */
router.post(
  '/upload',
  verifyToken,
  authorizeRoles("ANALYST", "SUBUSER"),
  uploadExcel.single('file'),
  cleanupFile,
  uploadController.uploadFile
);

/**
 * @swagger
 * /api/upload/mapping/{fileId}:
 *   get:
 *     summary: Get dashboard columns and uploaded file columns
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         example: "uuid-file-id"
 *     responses:
 *       200:
 *         description: Mapping data
 *         content:
 *           application/json:
 *             example:
 *               dashboardColumns:
 *                 - columnKey: campaign_name
 *                   displayName: Campaign Name
 *               fileColumns:
 *                 - Campaign Name
 *                 - Revenue
 */
router.get('/mapping/:fileId', verifyToken, uploadController.getMappingData);

//////////////////////////////////////////////////////
// 🔗 MAP COLUMNS
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/upload/map:
 *   post:
 *     summary: Map file columns to dashboard template columns
 *     description: Save column mappings between uploaded file and dashboard schema
 *     tags: [Upload]
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
 *               - mappings
 *             properties:
 *               fileId:
 *                 type: string
 *                 example: "uuid-file-id"
 *               mappings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - dashboardId
 *                     - templateField
 *                     - fileColumn
 *                   properties:
 *                     dashboardId:
 *                       type: integer
 *                       example: 1
 *                     templateField:
 *                       type: string
 *                       example: campaign_name
 *                     fileColumn:
 *                       type: string
 *                       example: Campaign Name
 *     responses:
 *       200:
 *         description: Mapping saved successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Mapping saved successfully
 *       500:
 *         description: Server error
 */
router.post(
  '/map',
  verifyToken,
  authorizeRoles("ANALYST", "SUBUSER"),
  uploadController.mapColumns
);
//////////////////////////////////////////////////////
// 🔥 BUILDER DATA (NEW)
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/upload/builder/{dashboardId}:
 *   get:
 *     summary: Get dashboard builder data (columns + sample data)
 *     description: Returns available columns and sample dataset for building charts (used in drag-drop UI like Power BI)
 *     tags: [Upload]
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
 *         description: Builder data fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               columns:
 *                 - key: campaign_name
 *                   type: STRING
 *                 - key: revenue
 *                   type: NUMBER
 *                 - key: date
 *                   type: DATE
 *               sampleData:
 *                 - campaign_name: "Campaign A"
 *                   revenue: 5000
 *                   date: "2024-01-01"
 *       500:
 *         description: Server error
 */
router.get(
  '/builder/:dashboardId',
  verifyToken,
  uploadController.getBuilderData
);
//////////////////////////////////////////////////////
// 📊 ANALYZE DATA
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/upload/analyze:
 *   post:
 *     summary: Analyze data and generate custom chart
 *     description: Generates dynamic chart based on selected fields, filters, and file data (used in chart builder UI)
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             dashboardId: 1
 *             fileId: "uuid-file-id"   # optional (uses latest if not provided)
 *             chartType: "BAR"
 *             xAxis: "campaign_name"
 *             yAxis: "revenue"
 *             filters:
 *               platform: "Google"
 *     responses:
 *       200:
 *         description: Chart generated successfully
 *         content:
 *           application/json:
 *             example:
 *               type: "bar"
 *               fileId: "uuid-file-id"
 *               data:
 *                 - name: "Campaign A"
 *                   value: 5000
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (only ANALYST / SUBUSER)
 *       500:
 *         description: Server error
 */
router.post(
  '/analyze',
  verifyToken,
  authorizeRoles("ANALYST", "SUBUSER"),
  uploadController.analyzeData
);
/**
 * @swagger
 * /api/export:
 *   post:
 *     summary: Export filtered data as Excel
 *     description: Exports mapped and filtered dashboard data into Excel file (.xlsx)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             dashboardId: 1
 *             fileId: "uuid-file-id"   # optional (uses latest if not provided)
 *             filters:
 *               platform: "Google"
 *               startDate: "2024-01-01"
 *               endDate: "2024-01-31"
 *     responses:
 *       200:
 *         description: Excel file downloaded successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/export',
  verifyToken,
  uploadController.exportData
);
//////////////////////////////////////////////////////
// ✅ VALIDATE DATA
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/upload/validation/{fileId}:
 *   get:
 *     summary: Get validation results
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Validation results
 *         content:
 *           application/json:
 *             example:
 *               totalRows: 15240
 *               nullCount: 12
 *               duplicateCount: 3
 */
router.get(
  '/validation/:fileId',
  verifyToken,
  authorizeRoles("ANALYST", "SUBUSER"),
  uploadController.getValidation
);
//////////////////////////////////////////////////////
// 📦 PROCESS DATA
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/upload/process:
 *   post:
 *     summary: Process uploaded data
 *     description: Final step after validation to mark data ready for dashboard usage
 *     tags: [Upload]
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
 *             properties:
 *               fileId:
 *                 type: string
 *                 example: "uuid-file-id"
 *     responses:
 *       200:
 *         description: Data processed successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Data processed successfully
 *       500:
 *         description: Server error
 */
router.post(
  '/process',
  verifyToken,
  authorizeRoles("ANALYST", "SUBUSER"),
  uploadController.processData
);
/**
 * @swagger
 * /api/upload/filters/{dashboardId}:
 *   get:
 *     summary: Get available filter values
 *     description: Returns unique values for each column (used for filter dropdown UI)
 *     tags: [Filters]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 29
 *     responses:
 *       200:
 *         description: Filter options fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               platform:
 *                 - Google
 *                 - Facebook
 *               campaign_name:
 *                 - Campaign A
 *                 - Campaign B
 */
router.get(
  '/filters/:dashboardId',
  verifyToken,
  uploadController.getFilterOptions
);

module.exports = router;