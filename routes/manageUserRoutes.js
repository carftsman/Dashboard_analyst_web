const express = require('express');
const router = express.Router();

const manageUserController = require('../controllers/manageUserController');
const {verifyToken,authorizeRoles} = require('../middleware/authMiddleware');

// Admin Manage Users page

/**
 * @swagger
 * /api/manage-users/logged-in-users:
 *   get:
 *     summary: Get all users for Manage Users page
 *     description: Returns the list of users with serial number, name, role, status, login status, and last login time. Only admin can access this API.
 *     tags:
 *       - Manage Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched successfully
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
 *                   example: Users fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ManageUser'
 *       401:
 *         description: Unauthorized - token missing or invalid
 *       403:
 *         description: Forbidden - only admin can access
 *       500:
 *         description: Internal server error
 */

router.get('/logged-in-users',verifyToken, authorizeRoles('ADMIN'), manageUserController.getLoggedInUsers);

module.exports = router;