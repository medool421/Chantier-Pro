const Joi = require('joi');

exports.createTaskSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().allow('', null),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH').default('NORMAL'),
  assignedTo: Joi.string().uuid().required(),
});

exports.updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(100),
  description: Joi.string().allow('', null),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH'),
});

exports.updateTaskStatusSchema = Joi.object({
  status: Joi.string()
    .valid('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED')
    .required(),
});
