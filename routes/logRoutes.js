const express = require('express');
const router = express.Router();

const logController = require('../controllers/logController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get user activity logs (with pagination)
 *     description: Returns paginated logs. Only ADMIN and ANALYST can access.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Logs fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               page: 1
 *               limit: 10
 *               total: 120
 *               totalPages: 12
 *               data:
 *                 - sNo: 1
 *                   user: Likitha
 *                   email: analyst@dhatvibs.com
 *                   action: VIEW
 *                   description: Accessed and viewed dashboard analytics data
 *                   time: 2026-03-26T04:54:33.826Z
 */
router.get(
  '/logs',
  verifyToken,
  authorizeRoles('ADMIN', 'ANALYST'),
  logController.getLogs
);

module.exports = router;