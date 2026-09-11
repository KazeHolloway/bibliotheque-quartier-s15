const AppError = require('../utils/AppError');

/**
 * Fabrique un middleware de validation à partir d'une liste de règles.
 * Chaque règle : { field, required, type, message }
 *
 * Exemple d'utilisation dans une route :
 *   router.post('/', validate([
 *     { field: 'nom', required: true, type: 'string' },
 *   ]), controller.create);
 */
function validate(rules) {
  return (req, res, next) => {
    const errors = [];

    for (const rule of rules) {
      const value = req.body[rule.field];
      const isMissing = value === undefined || value === null || value === '';

      if (rule.required && isMissing) {
        errors.push(rule.message || `Le champ "${rule.field}" est obligatoire.`);
        continue;
      }

      if (!isMissing && rule.type === 'number' && Number.isNaN(Number(value))) {
        errors.push(`Le champ "${rule.field}" doit être un nombre.`);
      }

      if (!isMissing && rule.type === 'date' && Number.isNaN(Date.parse(value))) {
        errors.push(`Le champ "${rule.field}" doit être une date valide (YYYY-MM-DD).`);
      }
    }

    if (errors.length > 0) {
      return next(new AppError(errors.join(' '), 400));
    }

    next();
  };
}

module.exports = validate;
