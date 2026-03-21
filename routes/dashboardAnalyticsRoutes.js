const express = require('express');
const router = express.Router();

const uploadExcel = require('../middleware/uploadExcelMiddleware');
const dashboardAnalyticsController = require('../controllers/dashboardAnalyticsController');
const { verifyToken,authorizeRoles } = require('../middleware/authMiddleware');
/**
 * @swagger
 * /api/dashboard/upload/sales:
 *   post:
 *     summary: Upload sales Excel file
 *     description: Upload a sales Excel file, validate required columns, save uploaded file details, and store row data in the database.
 *     tags:
 *       - Dashboard Analytics
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - dashboardId
 *               - file
 *             properties:
 *               dashboardId:
 *                 type: integer
 *                 example: 1
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Sales file uploaded successfully
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
 *                   example: Sales file uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileId:
 *                       type: integer
 *                       example: 6
 *                     fileName:
 *                       type: string
 *                       example: sales_dummy_data_30_records.xlsx
 *                     totalRows:
 *                       type: integer
 *                       example: 30
 *                     uploadedHeaders:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - Executive ID
 *                         - Executive Name
 *                         - Region
 *                         - State
 *                         - City
 *                         - Vendors Onboarded
 *                         - Vendors Active
 *                         - Orders From Vendors
 *                         - Revenue From Vendors
 *                         - Visits Per Day
 *                         - Target Vendors
 *                         - Achievement Percentage
 *                         - Month
 *                     missingColumns:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *                     extraColumns:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: []
 *                     isValid:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - no file, missing dashboardId, or empty Excel file
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
 *                   example: dashboardId is required
 *       401:
 *         description: Unauthorized - token missing or invalid
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
 *                   example: Unauthorized
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
 *         description: Upload failed
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
 *                   example: Upload failed
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

router.post(
  '/upload/sales',
  verifyToken,
  uploadExcel.single('file'),
  dashboardAnalyticsController.uploadSalesExcel
);
/**
 * @swagger
 * /api/dashboard/file/{fileId}/validation-summary:
 *   get:
 *     summary: Get validation summary of uploaded file
 *     description: Fetch validation summary including total rows, valid rows, invalid rows, uploaded columns, extra columns, and detailed errors for invalid rows.
 *     tags:
 *       - Dashboard Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the uploaded file
 *         example: 5
 *     responses:
 *       200:
 *         description: Validation summary fetched successfully
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
 *                   example: Validation summary fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileId:
 *                       type: integer
 *                       example: 5
 *                     fileName:
 *                       type: string
 *                       example: 1711023456789-sales_data.xlsx
 *                     status:
 *                       type: string
 *                       example: VALIDATED
 *                     uploadedColumns:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Executive Name", "Region", "Revenue From Vendors"]
 *                     extraColumns:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Remarks"]
 *                     totalRows:
 *                       type: integer
 *                       example: 30
 *                     validRows:
 *                       type: integer
 *                       example: 28
 *                     invalidRows:
 *                       type: integer
 *                       example: 2
 *                     invalidRowDetails:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rowId:
 *                             type: integer
 *                             example: 101
 *                           rowData:
 *                             type: object
 *                             example:
 *                               Executive Name: "Ravi"
 *                               Revenue From Vendors: ""
 *                           errors:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["Revenue From Vendors is required"]
 *       400:
 *         description: Invalid fileId provided
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Valid fileId is required
 *       404:
 *         description: Uploaded file not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Uploaded file not found
 *       500:
 *         description: Internal server error while fetching validation summary
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Fetch validation summary failed
 *               error: Internal server error
 */
router.get(
  '/file/:fileId/validation-summary',
  verifyToken,
  authorizeRoles('ADMIN', 'MANAGER', 'ANALYST', 'SUB_USER', 'USER'),
  dashboardAnalyticsController.getValidationSummary
);
module.exports = router;