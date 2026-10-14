const projectService = require('../services/project.service');
const teamService = require('../services/team.service');
const catchAsync = require('../utils/catchAsync');

exports.createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject(
    req.body,
    req.user.id,
    req.user.companyId
  );

  res.status(201).json({
    success: true,
    data: project,
  });
});

exports.getProjects = catchAsync(async (req, res) => {
  const projects = await projectService.getAllProjects(
    req.user,
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
    req.user
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
    req.user
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
    req.user
  );

  res.json({
    success: true,
    data: project,
  });
});

exports.deleteProject = catchAsync(async (req, res) => {
  await projectService.deleteProject(
    req.params.id,
    req.user
  );

  res.status(204).send();
});

exports.assignManager = catchAsync(async (req, res) => {
  const project = await projectService.assignManager(
    req.params.id,
    req.body.managerId,
    req.user
  );

  res.json({
    success: true,
    data: project,
  });
});

exports.getManagers = catchAsync(async (req, res) => {
  const managers = await projectService.getManagers(req.user.companyId);

  res.status(200).json({
    success: true,
    data: managers,
  });
});

exports.getWorkers = catchAsync(async (req, res) => {
  const workers = await projectService.getWorkers(req.user.companyId);

  res.status(200).json({
    success: true,
    data: workers,
  });
});

exports.getMyProject = async (req, res, next) => {
  try {
    const project = await projectService.getProjectByManager(req.user);

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectTeam = async (req, res, next) => {
  try {
    const team = await teamService.getProjectTeam(req.params.id, req.user);

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
};
