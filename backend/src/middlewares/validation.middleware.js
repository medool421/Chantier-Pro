const AppError = require('../utils/AppError');

/**
 * Middleware de validation avec Joi
 * @param {Object} schema - Schéma Joi de validation
 * @param {String} property - Propriété à valider (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Retourner toutes les erreurs
      stripUnknown: true, // Supprimer les champs non définis dans le schéma
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      return next(new AppError(errorMessage, 400));
    }

    // Remplacer les données validées
    req[property] = value;
    next();
  };
};

module.exports = validate;