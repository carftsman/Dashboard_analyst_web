const express = require('express');
const router = express.Router();

const logController = require('../controllers/logController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get user activity logs
 *     description: Returns all activity logs. Only ADMIN and ANALYST can access.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logs fetched successfully
 *         content:
 *           application/json:
 *             example:
 *               - sNo: 1
 *                 user: user_01
 *                 email: user_01@dhatvibs.com
 *                 action: LOGIN
 *                 description: Successful login via OAuth
 *                 time: 2026-03-25T10:00:00Z
 *       403:
 *         description: Access denied
 *       401:
 *         description: Unauthorized (Invalid or missing token)
 *       500:
 *         description: Server error
 */
router.get('/logs', verifyToken, authorizeRoles('ADMIN', 'ANALYST'), logController.getLogs);
module.exports = router;