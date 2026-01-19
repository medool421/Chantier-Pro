/**
 * Classe d'erreur personnalisée pour l'application
 * Hérite de la classe Error native de JavaScript
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    // Capture de la stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;