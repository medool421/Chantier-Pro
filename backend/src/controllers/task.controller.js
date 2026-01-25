const taskService = require('../services/task.service');
const catchAsync = require('../utils/catchAsync');

exports.createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask(
    req.params.projectId,
    req.body,
    req.user.id
  );

  res.status(201).json({
    success: true,
    data: task,
  });
});

exports.getProjectTasks = catchAsync(async (req, res) => {
  const tasks = await taskService.getProjectTasks(
    req.params.projectId,
    req.user
  );

  res.json({
    success: true,
    data: tasks,
  });
});

exports.getMyTasks = catchAsync(async (req, res) => {
  const tasks = await taskService.getMyTasks(req.user.id);

  res.json({
    success: true,
    data: tasks,
  });
});

exports.updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTask(
    req.params.id,
    req.body,
    req.user.id
  );

  res.json({
    success: true,
    data: task,
  });
});

exports.updateTaskStatus = catchAsync(async (req, res) => {
  const task = await taskService.updateTaskStatus(
    req.params.id,
    req.body.status,
    req.user
  );

  res.json({
    success: true,
    data: task,
  });
});

exports.deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.user.id);
  res.status(204).send();
});