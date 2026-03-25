const prisma = require('../prisma/prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const STATIC_OTP = "123456"; // 🔥 static (future → dynamic)

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "User inactive" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, parentId: user.parentId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.passwordReset.create({
      data: {
        email,
        otp: STATIC_OTP,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    res.json({
      message: "OTP sent successfully",
      otp: STATIC_OTP // ⚠️ only for testing
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await prisma.passwordReset.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" }
    });

    if (!record || record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > record.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    await prisma.passwordReset.update({
      where: { id: record.id },
      data: { verified: true }
    });

    res.json({ message: "OTP verified" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // ✅ 1. Check passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    // ✅ 2. Find latest OTP record
    const record = await prisma.passwordReset.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" }
    });

    if (!record) {
      return res.status(400).json({
        message: "OTP not found"
      });
    }

    // ✅ 3. Check OTP match
    if (record.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    // ✅ 4. Check expiry
    if (new Date() > record.expiresAt) {
      return res.status(400).json({
        message: "OTP expired"
      });
    }
if (!isValidPassword(newPassword)) {
  return res.status(400).json({
    message:
      "Password must start with a capital letter and be at least 8 characters long"
  });
}
    // ✅ 5. Hash password
    const hash = await bcrypt.hash(newPassword, 10);

    // ✅ 6. Update password
    await prisma.user.update({
      where: { email },
      data: { password: hash }
    });

    // ✅ 7. (Optional but recommended) invalidate OTP
    await prisma.passwordReset.update({
      where: { id: record.id },
      data: { verified: true }
    });

    res.json({
      message: "Password reset successful"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id } // ✅ FIX
    });

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }
if (!isValidPassword(newPassword)) {
  return res.status(400).json({
    success: false,
    message:
      "Password must start with a capital letter and be at least 8 characters long"
  });
}
    const hash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.user.id }, // ✅ FIX
      data: { password: hash }
    });

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};