const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
/**
 * ✅ Verify JWT Token Middleware
 */
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch full user (IMPORTANT)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
exports.verifyResetToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Reset token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used) {
      return res.status(400).json({
        success: false,
        message: "Invalid or used token",
      });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Token expired",
      });
    }

    req.resetToken = resetToken;
    req.userId = resetToken.userId; // ✅ IMPORTANT

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Token verification failed",
    });
  }
};
/**
 * ✅ Role-based Authorization Middleware
 */
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user exists from token
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized access'
        });
      }

      // Check role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: insufficient permissions'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: error.message
      });
    }
  };
};