require('dotenv').config();

module.exports = {
  // Secret pour signer les access tokens
  secret: process.env.JWT_SECRET,
  
  // Durée de validité de l'access token (15 minutes)
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  
  // Secret pour signer les refresh tokens
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  
  // Durée de validité du refresh token (7 jours)
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Algorithme de signature
  algorithm: 'HS256',
  
  // Issuer (émetteur du token)
  issuer: 'chantierpro-api',
  
  // Audience (destinataire du token)
  audience: 'chantierpro-mobile',
};