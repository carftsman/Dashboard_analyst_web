const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const uploadController = require('../controllers/uploadController');
/**
 * @swagger
 * /api/files/{dashboardId}:
 *   get:
 *     summary: Get uploaded files list for a dashboard
 *     description: Returns all uploaded files for a dashboard (latest first). Used for file selection dropdown.
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
 *         description: Files fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               - id: "uuid-file-id-1"
 *                 fileName: "jan_data.xlsx"
 *                 createdAt: "2026-03-20T10:00:00Z"
 *               - id: "uuid-file-id-2"
 *                 fileName: "feb_data.xlsx"
 *                 createdAt: "2026-03-21T10:00:00Z"
 *       500:
 *         description: Server error
 */
router.get('/files/:dashboardId', verifyToken, uploadController.getFiles);

/**
 * @swagger
 * /api/file/{fileId}:
 *   get:
 *     summary: Get file details
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
 *         description: File details fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               id: "uuid"
 *               fileName: "campaign.xlsx"
 *               createdAt: "2026-03-21T10:00:00Z"
 *       404:
 *         description: File not found
 */
router.get('/file/:fileId', verifyToken, uploadController.getFileById);

//////////////////////////////////////////////////////
// 🔄 SET ACTIVE FILE
//////////////////////////////////////////////////////

/**
 * @swagger
 * /api/files/active:
 *   post:
 *     summary: Set active file for dashboard
 *     tags: [Upload]
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
 *         description: Active file updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Active file updated
 *       500:
 *         description: Server error
 */
router.post('/files/active', verifyToken, uploadController.setActiveFile);
/**
 * @swagger
 * /api/files/{dashboardId}:
 *   get:
 *     summary: Get files for dashboard with auto-select support
 *     description: >
 *       Returns uploaded files for a dashboard.  
 *       If only one file exists, API will return autoOpen=true with fileId.  
 *       If multiple files exist, returns list for user selection.
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
 *         description: Files fetched successfully
 *         content:
 *           application/json:
 *             examples:
 *               singleFile:
 *                 summary: Auto open when one file exists
 *                 value:
 *                   autoOpen: true
 *                   fileId: "uuid-file-id"
 *               multipleFiles:
 *                 summary: Multiple files available
 *                 value:
 *                   autoOpen: false
 *                   files:
 *                     - id: "uuid-file-id-1"
 *                       fileName: "jan_data.xlsx"
 *                       createdAt: "2026-03-20T10:00:00Z"
 *                     - id: "uuid-file-id-2"
 *                       fileName: "feb_data.xlsx"
 *                       createdAt: "2026-03-21T10:00:00Z"
 *       401:
 *         description: Unauthorized (Invalid or missing token)
 *       500:
 *         description: Server error
 */
router.get('/files/:dashboardId', verifyToken, uploadController.getFilesWithAutoSelect);

module.exports = router;