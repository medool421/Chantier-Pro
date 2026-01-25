module.exports = (...allowedRoles) => { 
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }

    next();
  };
};