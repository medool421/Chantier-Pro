const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

// POST /auth/register-boss
exports.registerBoss = catchAsync(async (req, res) => {
  const result = await authService.registerBoss(req.body);

  res.status(201).json({
    success: true,
    data: result,
  });
});

// POST /auth/register (invited users only)
exports.register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    data: result,
  });
});

// POST /auth/login
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  res.json({
    success: true,
    data: result,
  });
});

// GET /auth/me
exports.me = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user.id);

  res.json({
    success: true,
    data: user,
  });
});