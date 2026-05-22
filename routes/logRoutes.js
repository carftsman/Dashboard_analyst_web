const express = require('express');
const router = express.Router();

const logController = require('../controllers/logController');
const {
  verifyToken,
  authorizeRoles
} = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get all user activity logs
 *     description: Returns paginated activity logs.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of logs per page
 *     responses:
 *       200:
 *         description: Logs fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               page: 1
 *               limit: 50
 *               total: 509
 *               pageCount: 11
 *               data:
 *                 - sNo: 1
 *                   user: Tulasi
 *                   email: tulasi.m@dhatvibs.com
 *                   action: UPLOAD_FILE
 *                   description: Tulasi uploaded "field_sales_performance.xlsx"
 *                   time: 2026-05-15T09:30:10.881Z
 */
router.get(
  '/logs',
  verifyToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'ANALYST'),
  logController.getLogs
);

module.exports = router;