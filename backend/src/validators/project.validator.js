const Joi = require('joi');

const createProjectSchema = Joi.object({
    name: Joi.string().required().trim().min(3).max(100),
    description: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null),
    budget: Joi.number().min(0).allow(null),
    status: Joi.string().valid('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED').default('PLANNED')
});

const updateProjectSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100),
    description: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).allow(null),
    budget: Joi.number().min(0).allow(null),
    status: Joi.string().valid('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED')
});

const updateStatusSchema = Joi.object({
    status: Joi.string().valid('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED').required()
});

const assignManagerSchema = Joi.object({
    managerId: Joi.string().uuid().required()
});

module.exports = {
    createProjectSchema,
    updateProjectSchema,
    updateStatusSchema,
    assignManagerSchema
};
