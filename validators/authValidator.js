const Joi = require("joi");

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

exports.verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required()
});