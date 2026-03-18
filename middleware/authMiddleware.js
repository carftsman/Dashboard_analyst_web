const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
/**
 * ✅ Verify JWT Token Middleware
 */
exports.verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret is not configured'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};
exports.verifyResetToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Reset token is required"
      });
    }

    const token = authHeader.split(" ")[1];

    // 🔍 Find token in DB
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken) {
      return res.status(404).json({
        success: false,
        message: "Invalid token"
      });
    }

    if (resetToken.used) {
      return res.status(400).json({
        success: false,
        message: "Token already used"
      });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Token expired"
      });
    }

    // ✅ Attach token data to request
    req.resetToken = resetToken;

    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Token verification failed",
      error: error.message
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