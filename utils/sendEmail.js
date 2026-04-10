const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Your OTP for Password Reset",
    html: `
      <h3>Password Reset OTP</h3>
      <p>Your OTP is: <b>${otp}</b></p>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  });
};