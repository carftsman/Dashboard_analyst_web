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
 *                 example: NewAdminn@123
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
 *     summary: Send OTP for Forgot Password
 *     tags: [Auth]
 *     description: Sends OTP to user email for password reset (currently static OTP)
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
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: OTP sent successfully
 *               data:
 *                 otp: "123123"
 *       404:
 *         description: User not found
 *       500:
 *         description: Forgot password failed
 */
router.post('/forgot-password', authController.forgotPassword);
/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     description: Verify OTP sent to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123123"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: OTP verified
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: OTP verification failed
 */
router.post('/verify-otp', authController.verifyOtp);
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset Password using OTP
 *     tags: [Auth]
 *     description: Reset user password using email and OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123123"
 *               newPassword:
 *                 type: string
 *                 example: NewPassword@123
 *               confirmPassword:
 *                 type: string
 *                 example: NewPassword@123
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Password reset successful
 *       400:
 *         description: Validation error or invalid OTP
 *       500:
 *         description: Reset password failed
 */ 
router.post('/reset-password', authController.resetPassword);
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