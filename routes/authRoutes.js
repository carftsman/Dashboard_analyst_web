const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, authorizeRoles,verifyResetToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User Login
 *     tags: [Auth]
 *     description: Authenticate user credentials and return JWT token with role-based redirect URL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@dhatvibs.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewAdmin@123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid email or password
 *       403:
 *         description: Account is inactive
 *       500:
 *         description: Login failed
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Forgot Password
 *     tags: [Auth]
 *     description: Generate a password reset token for the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@dhatvibs.com
 *     responses:
 *       200:
 *         description: Password reset token generated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Password reset token generated successfully
 *               data:
 *                 token: random_reset_token
 *                 expiresAt: 2026-03-18T10:30:00.000Z

 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: User not found

 *       500:
 *         description: Forgot password failed
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Forgot password failed
 *               error: Internal server error
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset Password
 *     tags: [Auth]
 *     description: Reset password using token from Authorization header
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword@123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               example:
 *                 success: true
 *                 message: Password reset successful
 *
 *       400:
 *         description: Validation or token error
 *         content:
 *           application/json:
 *             schema:
 *               examples:
 *                 passwordMismatch:
 *                   value:
 *                     success: false
 *                     message: Passwords do not match
 *                 tokenUsed:
 *                   value:
 *                     success: false
 *                     message: Token already used
 *                 tokenExpired:
 *                   value:
 *                     success: false
 *                     message: Token expired
 *
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               example:
 *                 success: false
 *                 message: Authorization token is required
 *
 *       404:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               example:
 *                 success: false
 *                 message: Invalid token
 *
 *       500:
 *         description: Reset password failed
 *         content:
 *           application/json:
 *             schema:
 *               example:
 *                 success: false
 *                 message: Reset password failed
 *                 error: Internal server error
 */
router.post('/reset-password',verifyResetToken, authController.resetPassword);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change Password
 *     tags: [Auth]
 *     description: Change user password using email and current password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: OldPassword@123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword@123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Password changed successfully
 *
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             examples:
 *               passwordMismatch:
 *                 value:
 *                   success: false
 *                   message: Passwords do not match
 *               wrongCurrentPassword:
 *                 value:
 *                   success: false
 *                   message: Current password is incorrect
 *
 *       403:
 *         description: Account inactive
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Account is inactive
 *
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: User not found
 *
 *       500:
 *         description: Change password failed
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Change password failed
 *               error: Internal server error
 */
router.post('/change-password', authController.changePassword);
router.post('/logout', verifyToken, authController.logout);
module.exports = router;