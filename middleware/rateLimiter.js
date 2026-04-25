const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

//////////////////////////////////////////////////////
// 🔐 COMMON KEY GENERATOR
//////////////////////////////////////////////////////
const generateKey = (req) => {
  const ip = ipKeyGenerator(req);
  const email = req.body?.email || "anonymous";
  return `${ip}-${email}`;
};

//////////////////////////////////////////////////////
// 🔐 LOGIN LIMITER
//////////////////////////////////////////////////////
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5,
  keyGenerator: generateKey,
  message: {
    success: false,
    message: "Too many login attempts. Try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});

//////////////////////////////////////////////////////
// 🔐 OTP LIMITER
//////////////////////////////////////////////////////
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: generateKey,
  message: {
    success: false,
    message: "Too many OTP requests. Try later."
  }
});
const verifyOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: generateKey,
  message: {
    success: false,
    message: "Too many OTP verification attempts"
  }
});
module.exports = {
  loginLimiter,
  otpLimiter,
  verifyOtpLimiter
};