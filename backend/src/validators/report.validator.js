const Joi = require('joi');

exports.createReportSchema = Joi.object({
  type: Joi.string()
    .valid('DAILY', 'WEEKLY', 'INCIDENT')
    .required(),
  title: Joi.string().min(3).max(100).required(),
  content: Joi.string().min(5).required(),
});
