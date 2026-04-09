const prisma = require('../prisma/prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require("../utils/sendEmail");

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
const isValidPassword = (password) => {
  if (!password) return false;

  // 🔥 Length check (12–16)
  if (password.length < 12 || password.length > 16) return false;

  // 🔥 First letter capital
  if (!/^[A-Z]/.test(password)) return false;

  // 🔥 At least 1 number
  if (!/\d/.test(password)) return false;

  // 🔥 At least 1 special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

  return true;
};
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

    //////////////////////////////////////////////////////
    // 🔥 GENERATE OTP
    //////////////////////////////////////////////////////
    const otp = generateOTP();

    //////////////////////////////////////////////////////
    // 🔥 SAVE OTP
    //////////////////////////////////////////////////////
    await prisma.passwordReset.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    //////////////////////////////////////////////////////
    // 🔥 SEND EMAIL
    //////////////////////////////////////////////////////
    await sendOtpEmail(email, otp);

    res.json({
      message: "OTP sent to email"
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
      "Password must be 12–16 characters, start with a capital letter, include at least one number and one special character"
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
      "Password must be 12–16 characters, start with a capital letter, include at least one number and one special character"
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