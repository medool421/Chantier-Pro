const Joi = require('joi');

exports.createTaskSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().allow('', null),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH').default('NORMAL'),
  assigneeIds: Joi.array().items(Joi.string().uuid()).unique(),
  assignedTo: Joi.string().uuid().allow(null),
  dueDate: Joi.date().allow(null),
});

exports.updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(100),
  description: Joi.string().allow('', null),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT'),
  assigneeIds: Joi.array().items(Joi.string().uuid()).unique(),
  assigneeId: Joi.string().uuid().allow(null),
  dueDate: Joi.date().allow(null),
});


exports.updateTaskStatusSchema = Joi.object({
  status: Joi.string()
    .valid('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED')
    .required(),
});
