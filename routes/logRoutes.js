const express = require('express');
const router = express.Router();

const logController = require('../controllers/logController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get all user activity logs
 *     description: Returns all logs without pagination.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logs fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               total: 120
 *               data:
 *                 - sNo: 1
 *                   user: Likitha
 *                   email: analyst@dhatvibs.com
 *                   action: VIEW
 *                   description: Accessed dashboard
 *                   time: 2026-03-26T04:54:33.826Z
 */
router.get(
  '/logs',
  verifyToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'ANALYST'),
  logController.getLogs
);

module.exports = router;