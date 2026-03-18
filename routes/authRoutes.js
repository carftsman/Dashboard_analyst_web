const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, authorizeRoles,verifyResetToken } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',verifyResetToken, authController.resetPassword);
// router.post('/change-password', authController.changePassword);
router.post('/change-password', authController.changePassword);
module.exports = router;