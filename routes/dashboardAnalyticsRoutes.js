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
 *     description: Upload a sales Excel/CSV file for a SALES dashboard, validate headers and rows, save uploaded file details, store row data, and generate validation results.
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
 *                 description: Upload .xlsx, .xls, or .csv file
 *     responses:
 *       201:
 *         description: File uploaded successfully
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
 *                   example: File uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileId:
 *                       type: integer
 *                       example: 12
 *                     totalRows:
 *                       type: integer
 *                       example: 30
 *                     validRows:
 *                       type: integer
 *                       example: 28
 *                     invalidRows:
 *                       type: integer
 *                       example: 2
 *                     extraColumns:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Remarks"]
 *       400:
 *         description: Bad request due to missing dashboardId, missing file, invalid dashboard category, empty file, or missing required columns
 *         content:
 *           application/json:
 *             examples:
 *               dashboardIdMissing:
 *                 summary: dashboardId missing
 *                 value:
 *                   success: false
 *                   message: dashboardId is required
 *               fileMissing:
 *                 summary: file missing
 *                 value:
 *                   success: false
 *                   message: File is required
 *               invalidCategory:
 *                 summary: only SALES dashboard allowed
 *                 value:
 *                   success: false
 *                   message: Only SALES dashboard allowed
 *               emptyFile:
 *                 summary: excel file empty
 *                 value:
 *                   success: false
 *                   message: Excel file is empty
 *               missingColumns:
 *                 summary: missing required columns
 *                 value:
 *                   success: false
 *                   message: Missing required columns
 *                   data:
 *                     isValid: false
 *                     missingColumns: ["Executive Name", "Month"]
 *                     extraColumns: ["Remarks"]
 *       404:
 *         description: Dashboard or uploading user not found
 *         content:
 *           application/json:
 *             examples:
 *               dashboardNotFound:
 *                 summary: dashboard not found
 *                 value:
 *                   success: false
 *                   message: Dashboard not found
 *               userNotFound:
 *                 summary: uploading user not found
 *                 value:
 *                   success: false
 *                   message: Uploading user not found in database
 *                   data:
 *                     tokenUserId: 5
 *                     tokenEmail: user@example.com
 *       500:
 *         description: Upload failed due to internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Upload failed
 *               error: Internal server error
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