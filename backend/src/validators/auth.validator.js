const Joi = require('joi');

// For BOSS self-registration — creates a company at the same time
exports.registerBossSchema = Joi.object({
  firstName: Joi.string().trim().min(2).required(),
  lastName: Joi.string().trim().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().optional(),
  companyName: Joi.string().trim().min(2).required(),
});

// For invited users (MANAGER / WORKER)
// email, role, companyId are derived from the invitation on the backend
// Frontend only sends: firstName, lastName, password, inviteToken
exports.registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).required(),
  lastName: Joi.string().trim().min(2).required(),
  password: Joi.string().min(6).required(),
  inviteToken: Joi.string().required(),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});