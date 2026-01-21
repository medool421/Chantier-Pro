const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

exports.register = async ({ password, ...data }) => {
  const user = await User.create({
    ...data,
    passwordHash: password,
  });

  const token = signToken({
    id: user.id,
    role: user.role,
  });

  return { user, token };
};

exports.login = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({
    id: user.id,
    role: user.role,
  });

  return { user, token };
};

exports.getMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};