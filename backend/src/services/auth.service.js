const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const jwtConfig = require('../config/jwt');

class AuthService {
  /**
   * Générer un access token
   */
  generateAccessToken(userId, role) {
    return jwt.sign(
      { id: userId, role },
      jwtConfig.secret,
      {
        expiresIn: jwtConfig.expiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }
    );
  }

  /**
   * Générer un refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      { id: userId },
      jwtConfig.refreshSecret,
      {
        expiresIn: jwtConfig.refreshExpiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }
    );
  }

  /**
   * Vérifier un access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expiré', 401);
      }
      throw new AppError('Token invalide', 401);
    }
  }

  /**
   * Vérifier un refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, jwtConfig.refreshSecret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Refresh token expiré', 401);
      }
      throw new AppError('Refresh token invalide', 401);
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(userData) {
    const { email, password, firstName, lastName, phone, role } = userData;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('Cet email est déjà utilisé', 400);
    }

    // Créer l'utilisateur
    const user = await User.create({
      email,
      passwordHash: password, // Sera hashé par le hook beforeCreate
      firstName,
      lastName,
      phone,
      role: role || 'WORKER',
    });

    // Générer les tokens
    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(email, password) {
    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new AppError('Votre compte est désactivé', 403);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Générer les tokens
    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshAccessToken(refreshToken) {
    // Vérifier le refresh token
    const decoded = this.verifyRefreshToken(refreshToken);

    // Récupérer l'utilisateur
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    if (!user.isActive) {
      throw new AppError('Votre compte est désactivé', 403);
    }

    // Générer un nouveau access token
    const newAccessToken = this.generateAccessToken(user.id, user.role);

    return {
      accessToken: newAccessToken,
    };
  }

  /**
   * Récupérer le profil utilisateur
   */
  async getProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    return user.toJSON();
  }
}

module.exports = new AuthService();