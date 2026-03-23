const express = require('express');
const router = express.Router();
const columnController = require('../controllers/columnController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/columns/data-types', verifyToken, columnController.getDataTypes);
/**
 * @swagger
 * /api/admin/dashboard/columns:
 *   get:
 *     summary: Get available data types
 *     description: Returns list of allowed data types for creating columns (used for dropdown in UI).
 *     tags:
 *       - Columns
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data types fetched successfully
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
 *                   example: Data types fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example:
 *                     - STRING
 *                     - NUMBER
 *                     - BOOLEAN
 *                     - DATE
 *       500:
 *         description: Fetch data types failed
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
 *                   example: Fetch data types failed
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/columns', verifyToken, columnController.getColumns);
/**
 * @swagger
 * /api/admin/dashboard/{dashboardId}/columns:
 *   post:
 *     summary: Create a column for a dashboard
 *     description: Creates a new column for a specific dashboard using column name and data type.
 *     tags:
 *       - Columns
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         description: Dashboard ID
 *         schema:
 *           type: integer
 *           example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - columnName
 *               - dataType
 *             properties:
 *               columnName:
 *                 type: string
 *                 example: Executive Name
 *               dataType:
 *                 type: string
 *                 enum: [STRING, NUMBER, BOOLEAN, DATE]
 *                 example: STRING
 *     responses:
 *       201:
 *         description: Column created successfully
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
 *                   example: Column created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     dashboardId:
 *                       type: integer
 *                       example: 2
 *                     columnName:
 *                       type: string
 *                       example: Executive Name
 *                     dataType:
 *                       type: string
 *                       example: STRING
 *                     isRequired:
 *                       type: boolean
 *                       example: false
 *                     defaultValue:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     description:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     updatedById:
 *                       type: integer
 *                       example: 5
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-03-23T10:30:00.000Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-03-23T10:30:00.000Z
 *       400:
 *         description: Validation or duplicate error
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
 *                   example: "Invalid data type. Allowed values are: STRING, NUMBER, BOOLEAN, DATE"
 *       500:
 *         description: Create column failed
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
 *                   example: Create column failed
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.post('/:dashboardId/columns', verifyToken, columnController.createColumn);


module.exports = router;