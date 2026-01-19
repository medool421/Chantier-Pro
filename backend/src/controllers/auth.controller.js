const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: 'Inscription réussie',
    data: result,
  });
});

/**
 * @desc    Connexion d'un utilisateur
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  
  const result = await authService.login(email, password);

  res.status(200).json({
    success: true,
    message: 'Connexion réussie',
    data: result,
  });
});

/**
 * @desc    Rafraîchir le token d'accès
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
exports.refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  
  const result = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    message: 'Token rafraîchi avec succès',
    data: result,
  });
});

/**
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = catchAsync(async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

/**
 * @desc    Déconnexion (côté client uniquement)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
exports.logout = catchAsync(async (req, res) => {
  // Note: Dans une architecture JWT stateless, la déconnexion se fait côté client
  // en supprimant les tokens. On pourrait implémenter une blacklist de tokens ici.
  
  res.status(200).json({
    success: true,
    message: 'Déconnexion réussie',
  });
});