const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pas de token = 401
      throw new AppError('Unauthorized: No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (jwtErr) {
      // Si verifyToken échoue (expiration, mauvais format, etc.)
      // On force un code 401 pour déclencher le logout sur le mobile
      throw new AppError('Session expired or invalid token', 401);
    }
  } catch (err) {
    next(err);
  }
};