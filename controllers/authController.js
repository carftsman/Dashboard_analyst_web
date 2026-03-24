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
    const { email, newPassword, confirmPassword } = req.body;

    // ✅ 1. Check passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    // ✅ 2. Check OTP verified
    const record = await prisma.passwordReset.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" }
    });

    if (!record || !record.verified) {
      return res.status(400).json({
        message: "OTP not verified"
      });
    }

    // ✅ 3. Hash password
    const hash = await bcrypt.hash(newPassword, 10);

    // ✅ 4. Update password
    await prisma.user.update({
      where: { email },
      data: { password: hash }
    });

    res.json({
      message: "Password reset successful"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};