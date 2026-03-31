const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const uploadController = require('../controllers/uploadController');

/**
 * @swagger
 * /api/files/{fileId}:
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
router.get('/:fileId', verifyToken, uploadController.getFileById);
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

module.exports = router;