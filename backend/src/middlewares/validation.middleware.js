const AppError = require('../utils/AppError');

module.exports = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: true,      // return first error only
      allowUnknown: false,  // block extra fields
      stripUnknown: true,   // remove unknown fields
    });

    if (error) {
      return next(
        new AppError(error.details[0].message, 400)
      );
    }

    req[property] = value;
    next();
  };
};
