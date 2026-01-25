const Joi = require('joi');

exports.uploadFileSchema = Joi.object({
  type: Joi.string()
    .valid('BEFORE', 'AFTER', 'ISSUE')
    .required(),
  projectId: Joi.string().uuid().required(),
  taskId: Joi.string().uuid().optional().allow(null),
});
