const express = require('express');
const router = express.Router();

const fileController = require('../controllers/fileController');
const { verifyToken } = require('../middleware/authMiddleware');
/**
 * @swagger
 * /api/files/{fileId}/preview:
 *   get:
 *     summary: Get uploaded file preview rows
 *     description: Fetch preview rows for an uploaded file. You can optionally filter rows by status as VALID or INVALID. Returns up to 50 rows ordered by row ID ascending.
 *     tags:
 *       - Dashboard Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         description: ID of the uploaded file
 *         schema:
 *           type: integer
 *         example: 6
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filter rows by validation status
 *         schema:
 *           type: string
 *           enum: [VALID, INVALID]
 *         example: VALID
 *     responses:
 *       200:
 *         description: Preview rows fetched successfully
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
 *                   example: Preview rows fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 101
 *                       fileId:
 *                         type: integer
 *                         example: 6
 *                       rowData:
 *                         type: object
 *                         example:
 *                           Executive ID: "EX101"
 *                           Executive Name: "Ravi Kumar"
 *                           Region: "South"
 *                           State: "Telangana"
 *                           City: "Hyderabad"
 *                           Vendors Onboarded: 15
 *                           Vendors Active: 12
 *                           Orders From Vendors: 120
 *                           Revenue From Vendors: 45000
 *                           Visits Per Day: 8
 *                           Target Vendors: 20
 *                           Achievement Percentage: 75
 *                           Month: "January"
 *                       status:
 *                         type: string
 *                         example: VALID
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-03-21T10:30:00.000Z
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-03-21T10:30:00.000Z
 *       400:
 *         description: File ID is missing or invalid
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: File ID is required
 *       404:
 *         description: Uploaded file not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Uploaded file not found
 *       500:
 *         description: Internal server error while fetching preview rows
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Fetch preview failed
 *               error: Internal server error
 */
router.get('/:fileId/preview', verifyToken, fileController.getFilePreview);

module.exports = router;