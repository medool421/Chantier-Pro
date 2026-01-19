const authService = require('../services/auth.service');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Middleware pour vérifier l'authentification JWT
 */
const authenticate = catchAsync(async (req, res, next) => {
  // 1. Récupérer le token depuis le header Authorization
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Vous devez être connecté pour accéder à cette ressource', 401));
  }

  // 2. Vérifier le token
  const decoded = authService.verifyAccessToken(token);

  // 3. Récupérer l'utilisateur depuis la base de données
  const user = await User.findByPk(decoded.id);
  if (!user) {
    return next(new AppError('L\'utilisateur associé à ce token n\'existe plus', 401));
  }

  // 4. Vérifier si le compte est actif
  if (!user.isActive) {
    return next(new AppError('Votre compte est désactivé', 403));
  }

  // 5. Ajouter l'utilisateur à la requête
  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  next();
});

/**
 * Middleware optionnel - Ne bloque pas si pas de token
 * Utile pour les routes publiques qui peuvent afficher plus de contenu si connecté
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = authService.verifyAccessToken(token);
    const user = await User.findByPk(decoded.id);
    
    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur
  }

  next();
});

module.exports = {
  authenticate,
  optionalAuth,
};