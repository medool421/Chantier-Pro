const { Report, Project, User } = require('../models');
const AppError = require('../utils/AppError');
const { findAuthorizedProject } = require('../utils/projectAccess');

async function createReport(projectId, data, user) {
  await findAuthorizedProject(projectId, user);

  return Report.create({
    type: data.type,
    title: data.title,
    content: data.content,
    reportDate: data.reportDate,
    projectId,
    userId: user.id,
  });
}

async function getProjectReports(projectId, user) {
  await findAuthorizedProject(projectId, user);

  return Report.findAll({
    where: { projectId },
    include: [
      {
        model: User,
        as: 'user',
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
        as: 'project',
        attributes: ['id', 'name'],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
  });

  if (!report) {
    throw new AppError('Report not found', 404);
  }

  await findAuthorizedProject(report.projectId, user);

  return report;
}

module.exports = {
  createReport,
  getProjectReports,
  getReportById,
};
