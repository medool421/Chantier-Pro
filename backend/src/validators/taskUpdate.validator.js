const Joi = require('joi');

exports.createTaskUpdateSchema = Joi.object({
  taskId: Joi.string().uuid().required(),
  type: Joi.string().valid('DONE', 'BLOCKED').required(),
  message: Joi.string().allow('', null),
});
