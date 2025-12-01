const Joi = require('joi');

const emailSchema = Joi.object({
  to: Joi.alternatives()
    .try(
      Joi.string().email().required(),
      Joi.array().items(Joi.string().email()).min(1).required()
    )
    .required(),
  subject: Joi.string().min(1).max(255).required(),
  html: Joi.string().min(1).required(),
  metadata: Joi.object().optional()
});

const otpSchema = Joi.object({
  to: Joi.string().email().required(),
  userName: Joi.string().optional(),
  otpCode: Joi.string().required(),
  expiryMinutes: Joi.number().integer().min(1).max(60).optional()
});

const passwordResetSchema = Joi.object({
  to: Joi.string().email().required(),
  userName: Joi.string().optional(),
  resetToken: Joi.string().required(),
  expiryMinutes: Joi.number().integer().min(1).max(120).optional()
});

const welcomeSchema = Joi.object({
  to: Joi.string().email().required(),
  userName: Joi.string().optional(),
  features: Joi.array().items(Joi.string()).optional(),
  ctaLink: Joi.string().uri().optional(),
  ctaText: Joi.string().optional()
});

function validateEmail(data) {
  return emailSchema.validate(data);
}

function validateOTP(data) {
  return otpSchema.validate(data);
}

function validatePasswordReset(data) {
  return passwordResetSchema.validate(data);
}

function validateWelcome(data) {
  return welcomeSchema.validate(data);
}

module.exports = {
  validateEmail,
  validateOTP,
  validatePasswordReset,
  validateWelcome
};
