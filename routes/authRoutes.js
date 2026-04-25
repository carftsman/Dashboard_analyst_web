const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter, otpLimiter, verifyOtpLimiter } = require("../middleware/rateLimiter");const { verifyToken } = require('../middleware/authMiddleware');
const validate = require("../middleware/validate");
const {
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema
} = require("../validators/authValidator");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */

router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  authController.login
);
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send static OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post(
  "/forgot-password",
  otpLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 */
router.post(
  "/verify-otp",
  verifyOtpLimiter,
  validate(verifyOtpSchema),
  authController.verifyOtp
);
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Auth]
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
 *                 example: "analyst@gmail.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "analyst@123"
 *               confirmPassword:
 *                 type: string
 *                 example: "analyst@123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP / OTP expired / Password mismatch
 */
router.post('/reset-password', authController.resetPassword);
/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change Password
 *     description: Change user password using email and current password
 *     tags: [Auth]
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
 *                 example: "user@example.com"
 *               currentPassword:
 *                 type: string
 *                 example: "OldPassword@123"
 *               newPassword:
 *                 type: string
 *                 example: "NewPassword@123"
 *               confirmPassword:
 *                 type: string
 *                 example: "NewPassword@123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Password changed successfully
 */
router.post('/change-password', verifyToken, authController.changePassword);
module.exports = router;    