const taskUpdateService = require('../services/taskUpdate.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.createUpdate = catchAsync(async (req, res) => {
  if (req.file && !Buffer.isBuffer(req.file.buffer)) {
    throw new AppError('Invalid task update photo', 400);
  }

  const update = await taskUpdateService.createTaskUpdate(req.body, req.file, req.user);

  res.status(201).json({
    success: true,
    data: update,
  });
});

exports.getUpdatesByTask = catchAsync(async (req, res) => {
  const updates = await taskUpdateService.getTaskUpdatesByTask(
    req.params.taskId,
    req.user
  );

  res.json({
    success: true,
    data: updates,
  });
});

exports.getUpdatePhoto = catchAsync(async (req, res) => {
  const filePath = await taskUpdateService.getTaskUpdatePhoto(
    req.params.updateId,
    req.user
  );

  res.sendFile(filePath);
});
