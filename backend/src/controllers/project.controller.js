const projectService = require('../services/project.service');
const catchAsync = require('../utils/catchAsync');

exports.createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject(
    req.body,
    req.user.id
  );

  res.status(201).json({
    success: true,
    data: project,
  });
});

exports.getProjects = catchAsync(async (req, res) => {
  const projects = await projectService.getAllProjects(
    req.user.id,
    req.query
  );

  res.json({
    success: true,
    data: projects,
  });
});

exports.getProject = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(
    req.params.id,
    req.user.id
  );

  res.json({
    success: true,
    data: project,
  });
});

exports.updateProject = catchAsync(async (req, res) => {
  const project = await projectService.updateProject(
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
  const project = await projectService.updateStatus(
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
  await projectService.deleteProject(
    req.params.id,
    req.user.id
  );

  res.status(204).send();
});

exports.assignManager = catchAsync(async (req, res) => {
  const project = await projectService.assignManager(
    req.params.id,
    req.body.managerId,
    req.user.id
  );

  res.json({
    success: true,
    data: project,
  });
});

exports.getManagers = catchAsync(async (req, res) => {
  const managers = await projectService.getManagers();

  res.status(200).json({
    success: true,
    data: managers,
  });
});

exports.getMyProject = async (req, res, next) => {
  try {
    const project = await projectService.getProjectByManager(req.user.id);

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};