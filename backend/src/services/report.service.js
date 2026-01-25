const { Report, Project, User } = require('../models');
const AppError = require('../utils/AppError');

async function createReport(projectId, data, managerId) {
  const project = await Project.findOne({
    where: { id: projectId, managerId },
  });

  if (!project) {
    throw new AppError('Project not found or access denied', 404);
  }

  return Report.create({
    type: data.type,
    title: data.title,
    content: data.content,
    projectId,
    createdBy: managerId,
  });
}

async function getProjectReports(projectId, user) {
  const project = await Project.findByPk(projectId);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (
    user.role === 'MANAGER' &&
    project.managerId !== user.id
  ) {
    throw new AppError('Access denied', 403);
  }

  return Report.findAll({
    where: { projectId },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
}

async function getReportById(id, user) {
  const report = await Report.findByPk(id, {
    include: [
      {
        model: Project,
        attributes: ['id', 'name'],
      },
      {
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
  });

  if (!report) {
    throw new AppError('Report not found', 404);
  }

  if (
    user.role === 'MANAGER' &&
    report.createdBy !== user.id
  ) {
    throw new AppError('Access denied', 403);
  }

  return report;
}

module.exports = {
  createReport,
  getProjectReports,
  getReportById,
};
