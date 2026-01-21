const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  updateStatus,
  deleteProject,
  assignManager,
  calculateProgress,
} = require('../services/project.service');
const catchAsync = require('../utils/catchAsync');

exports.createProject = catchAsync(async (req, res) => {
  const project = await  createProject(
    req.body,
    req.user.id
  );

  res.status(201).json({
    success: true,
    data: project,
  });
});

exports.getProjects = catchAsync(async (req, res) => {
  const projects = await  getAllProjects(
    req.user.id,
    req.query
  );

  res.json({
    success: true,
    data: projects,
  });
});

exports.getProject = catchAsync(async (req, res) => {
  const project = await  getProjectById(
    req.params.id,
    req.user.id
  );

  res.json({
    success: true,
    data: project,
  });
});

exports.updateProject = catchAsync(async (req, res) => {
  const project = await  updateProject(
    req.params.id,
    req.body,
    req.user.id
  );

  res.json({
    success: true,
    data: project,
  });
});

exports.updateProjectStatus = catchAsync(async (req, res) => {
  const project = await  updateStatus(
    req.params.id,
    req.body.status,
    req.user.id
  );

  res.json({
    success: true,
    data: project,
  });
});

exports.deleteProject = catchAsync(async (req, res) => {
  await  deleteProject(
    req.params.id,
    req.user.id
  );

  res.status(204).send();
});

exports.assignManager = catchAsync(async (req, res) => {
  const project = await  assignManager(
    req.params.id,
    req.body.managerId,
    req.user.id
  );

  res.json({
    success: true,
    data: project,
  });
});