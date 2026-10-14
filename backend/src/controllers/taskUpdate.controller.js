const taskUpdateService = require('../services/taskUpdate.service');
const catchAsync = require('../utils/catchAsync');

exports.createUpdate = catchAsync(async (req, res) => {
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
