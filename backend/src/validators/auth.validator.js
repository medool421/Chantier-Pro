const Joi = require('joi');

const authValidator = {
  /**
   * Validation pour l'inscription
   */
  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email invalide',
        'any.required': 'L\'email est requis',
      }),
    
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
        'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
        'any.required': 'Le mot de passe est requis',
      }),
    
    firstName: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Le prénom doit contenir au moins 2 caractères',
        'string.max': 'Le prénom ne peut pas dépasser 100 caractères',
        'any.required': 'Le prénom est requis',
      }),
    
    lastName: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Le nom doit contenir au moins 2 caractères',
        'string.max': 'Le nom ne peut pas dépasser 100 caractères',
        'any.required': 'Le nom est requis',
      }),
    
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
      .allow('', null)
      .messages({
        'string.pattern.base': 'Numéro de téléphone invalide',
      }),
    
    role: Joi.string()
      .valid('WORKER', 'MANAGER', 'BOSS')
      .default('WORKER')
      .messages({
        'any.only': 'Le rôle doit être WORKER, MANAGER ou BOSS',
      }),
  }),

  /**
   * Validation pour la connexion
   */
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email invalide',
        'any.required': 'L\'email est requis',
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Le mot de passe est requis',
      }),
  }),

  /**
   * Validation pour le refresh token
   */
  refresh: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Le refresh token est requis',
      }),
  }),
};

module.exports = authValidator;