// Enrobe une fonction controller async pour envoyer automatiquement
// toute erreur vers le middleware de gestion d'erreurs (next(err)).
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
