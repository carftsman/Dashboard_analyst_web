const prisma = require('../prisma/prismaClient');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email,
        isDeleted: false
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: { lastLoginAt: new Date() }
    // });
const updatedUser = await prisma.user.update({
  where: { id: user.id },
  data: {
    isLoggedIn: true,
    lastLoginAt: new Date()
  }
});

console.log('Updated user after login:', updatedUser);
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    let redirectTo = '/dashboard';

    if (user.role === 'ADMIN') redirectTo = '/admin/dashboard';
    if (user.role === 'MANAGER') redirectTo = '/manager/dashboard';
    if (user.role === 'ANALYST') redirectTo = '/analyst/dashboard';
    if (user.role === 'SUB_USER') redirectTo = '/sub-user/dashboard';
    if (user.role === 'USER') redirectTo = '/user/dashboard';

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status
        },
        redirectTo
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // STATIC OTP for now
    const otp = "123123";

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        otp,
        expiresAt
      }
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        otp // remove in production
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Forgot password failed',
      error: error.message
    });
  }
};
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    const record = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        otp,
        used: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (new Date() > record.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message
    });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    const record = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        otp,
        used: false
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (new Date() > record.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Reset password failed',
      error: error.message
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword, confirmPassword } = req.body;

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be same as current password'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Change password failed',
      error: error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        isLoggedIn: false
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};