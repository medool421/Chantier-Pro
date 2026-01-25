const Joi = require('joi');

const createTeamSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().allow('', null),
    projectId: Joi.string().uuid().required()
});

const updateTeamSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100),
    description: Joi.string().allow('', null)
});

const addMemberSchema = Joi.object({
    userId: Joi.string().uuid().required(),
    roleInTeam: Joi.string().default('MEMBER')
});

const updateMemberSchema = Joi.object({
    roleInTeam: Joi.string().required()
});

module.exports = {
    createTeamSchema,
    updateTeamSchema,
    addMemberSchema,
    updateMemberSchema
};
