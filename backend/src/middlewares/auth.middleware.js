const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};