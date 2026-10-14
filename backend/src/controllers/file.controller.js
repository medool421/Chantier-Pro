const fileService = require('../services/file.service');
const catchAsync = require('../utils/catchAsync');

function serializeFile(file, req) {
  const data = file.toJSON ? file.toJSON() : file;
  const metadata = { ...data };
  delete metadata.url;

  return {
    ...metadata,
    downloadUrl: `${req.protocol}://${req.get('host')}/api/files/${data.id}/download`,
  };
}

exports.uploadFile = catchAsync(async (req, res) => {
  const file = await fileService.uploadFile(
    req.body,
    req.file,
    req.user
  );

  res.status(201).json({
    success: true,
    data: serializeFile(file, req),
  });
});

exports.getProjectFiles = catchAsync(async (req, res) => {
  const files = await fileService.getProjectFiles(
    req.params.projectId,
    req.user
  );

  res.json({
    success: true,
    data: files.map((file) => serializeFile(file, req)),
  });
});

exports.getFile = catchAsync(async (req, res) => {
  const file = await fileService.getFileById(req.params.id, req.user);

  res.json({
    success: true,
    data: serializeFile(file, req),
  });
});

exports.downloadFile = catchAsync(async (req, res, next) => {
  const { file, filePath } = await fileService.getFileDownload(
    req.params.id,
    req.user
  );

  res.download(filePath, file.originalName, { dotfiles: 'deny' }, (error) => {
    if (error && !res.headersSent) next(error);
  });
});

exports.deleteFile = catchAsync(async (req, res) => {
  await fileService.deleteFile(req.params.id, req.user);
  res.status(204).send();
});
