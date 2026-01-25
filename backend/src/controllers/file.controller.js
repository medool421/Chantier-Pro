const fileService = require('../services/file.service');
const catchAsync = require('../utils/catchAsync');

exports.uploadFile = catchAsync(async (req, res) => {
  const file = await fileService.uploadFile(
    req.body,
    req.file,
    req.user
  );

  res.status(201).json({
    success: true,
    data: file,
  });
});

exports.getProjectFiles = catchAsync(async (req, res) => {
  const files = await fileService.getProjectFiles(
    req.params.projectId
  );

  res.json({
    success: true,
    data: files,
  });
});

exports.deleteFile = catchAsync(async (req, res) => {
  await fileService.deleteFile(req.params.id);
  res.status(204).send();
});
