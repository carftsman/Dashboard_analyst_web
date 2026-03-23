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
 *     description: Upload an Excel file for a specific dashboard, validate headers against admin-defined schema, map columns, and store rows.
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
 *                 description: Excel file (.xlsx or .xls)
 *     responses:
 *       201:
 *         description: Sales file uploaded and processed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Sales file uploaded and columns mapped successfully
 *               data:
 *                 fileId: 10
 *                 fileName: sales_data.xlsx
 *                 dashboardId: 1
 *                 dashboardName: Sales Dashboard
 *                 totalRows: 30
 *                 uploadedHeaders:
 *                   - Executive ID
 *                   - Executive Name
 *                   - Region
 *                   - State
 *                   - City
 *                   - Vendors Onboarded
 *                   - Vendors Active
 *                   - Orders From Vendors
 *                   - Revenue From Vendors
 *                   - Visits Per Day
 *                   - Target Vendors
 *                   - Achievement Percentage
 *                   - Month
 *                 adminCreatedColumns:
 *                   - columnName: Executive ID
 *                     dataType: STRING
 *                   - columnName: Executive Name
 *                     dataType: STRING
 *                 mappedColumns:
 *                   - uploadedColumn: Executive ID
 *                     mappedTo: Executive ID
 *                     dataType: STRING
 *                     isMapped: true
 *                 unmappedUploadedColumns: []
 *                 missingAdminColumns: []
 *                 isValid: true
 *       400:
 *         description: Bad request (missing file, invalid dashboardId, empty file)
 *       404:
 *         description: Dashboard not found
 *       500:
 *         description: Upload failed
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