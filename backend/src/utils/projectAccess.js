const { Op } = require('sequelize');
const Project = require('../models/Project');
const AppError = require('./AppError');

function projectAccessWhere(user) {
  if (!user || !user.id || !user.role) {
    return { id: null };
  }

  const legacyScope = { companyId: null };

  if (user.role === 'BOSS') {
    const scopes = [
      { ...legacyScope, bossId: user.id },
    ];

    if (user.companyId) {
      scopes.unshift({ companyId: user.companyId });
    }

    return { [Op.or]: scopes };
  }

  if (user.role === 'MANAGER') {
    const scopes = [legacyScope];

    if (user.companyId) {
      scopes.unshift({ companyId: user.companyId });
    }

    return {
      managerId: user.id,
      [Op.or]: scopes,
    };
  }

  return { id: null };
}

function isAuthorizedProject(project, user) {
  if (!project || !user) return false;

  if (!project.companyId) {
    return (
      (user.role === 'BOSS' && project.bossId === user.id) ||
      (user.role === 'MANAGER' && project.managerId === user.id)
    );
  }

  if (!user.companyId || project.companyId !== user.companyId) {
    return false;
  }

  if (user.role === 'BOSS') return true;
  return user.role === 'MANAGER' && project.managerId === user.id;
}

function assertAuthorizedProject(project, user) {
  if (!isAuthorizedProject(project, user)) {
    throw new AppError('Project not found or access denied', 404);
  }

  return project;
}

async function findAuthorizedProject(id, user, options = {}) {
  const project = await Project.findByPk(id, options);
  return assertAuthorizedProject(project, user);
}

module.exports = {
  projectAccessWhere,
  isAuthorizedProject,
  assertAuthorizedProject,
  findAuthorizedProject,
};
