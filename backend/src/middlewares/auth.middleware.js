const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized: No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      // Si verifyToken échoue (expiration, mauvais format, etc.)
      // On force un code 401 pour déclencher le logout sur le mobile
      throw new AppError('Session expired or invalid token', 401);
    }

    // Access tokens are stateless JWTs. Recheck the account so deletion or
    // deactivation takes effect immediately instead of waiting for expiry.
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'companyId', 'isActive', 'status'],
    });
    if (!user || !user.isActive || user.status !== 'ACTIVE') {
      throw new AppError('Session expired or invalid token', 401);
    }

    req.user = {
      id: user.id,
      role: user.role,
      companyId: user.companyId,
    };
    return next();
  } catch (err) {
    return next(err);
  }
};
