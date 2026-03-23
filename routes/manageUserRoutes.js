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
/**
 * @swagger
 * /api/manage-users/users/{id}:
 *   put:
 *     summary: Update user details
 *     description: Update user full name, role, or status. Only ADMIN can update users.
 *     tags:
 *       - Manage Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID to update
 *         schema:
 *           type: integer
 *           example: 5
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Ravi Kumar
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, ANALYST, SUB_USER, USER]
 *                 example: MANAGER
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: User updated successfully
 *               data:
 *                 id: 5
 *                 fullName: Ravi Kumar
 *                 email: ravi@example.com
 *                 role: MANAGER
 *                 status: ACTIVE
 *       400:
 *         description: Invalid user id
 *       404:
 *         description: User not found
 *       500:
 *         description: Update user failed
 */
router.put('/users/:id', verifyToken, authorizeRoles('ADMIN'),manageUserController.updateUser);
/**
 * @swagger
 * /api/manage-users/users/{id}:
 *   delete:
 *     summary: Delete (soft delete) a user
 *     description: Marks a user as deleted by setting isDeleted to true and status to INACTIVE. Only ADMIN can delete users.
 *     tags:
 *       - Manage Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID to delete
 *         schema:
 *           type: integer
 *           example: 5
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: User deleted successfully
 *       400:
 *         description: Invalid user id
 *       404:
 *         description: User not found
 *       500:
 *         description: Delete user failed
 */
router.delete('/users/:id', verifyToken, authorizeRoles('ADMIN'), manageUserController.deleteUser);
module.exports = router;