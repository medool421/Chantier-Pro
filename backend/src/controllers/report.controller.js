const reportService = require('../services/report.service');
const catchAsync = require('../utils/catchAsync');

exports.createReport = catchAsync(async (req, res) => {
  const report = await reportService.createReport(
    req.params.projectId,
    req.body,
    req.user.id
  );

  res.status(201).json({
    success: true,
    data: report,
  });
});

exports.getProjectReports = catchAsync(async (req, res) => {
  const reports = await reportService.getProjectReports(
    req.params.projectId,
    req.user
  );

  res.json({
    success: true,
    data: reports,
  });
});

exports.getReportById = catchAsync(async (req, res) => {
  const report = await reportService.getReportById(
    req.params.id,
    req.user
  );

  res.json({
    success: true,
    data: report,
  });
});
