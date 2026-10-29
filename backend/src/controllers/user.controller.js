const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');

exports.deleteMe = catchAsync(async (req, res) => {
  const result = await userService.deleteMyAccount(req.user.id);
  res.json(result);
});
