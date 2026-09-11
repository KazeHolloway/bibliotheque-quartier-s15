// Middleware de gestion d'erreurs centralisée.
// Doit être déclaré en dernier dans app.js (4 arguments = Express
// le reconnaît automatiquement comme error handler).
function errorHandler(err, req, res, next) {
  // Erreurs "métier" qu'on a levées nous-mêmes (AppError)
  if (err.isAppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Erreurs PostgreSQL connues qu'on traduit en messages clairs
  if (err.code === '23503') {
    // foreign_key_violation
    return res.status(409).json({
      error:
        "Impossible d'effectuer cette action : la ressource est référencée ailleurs (ex. un livre, un emprunt).",
    });
  }

  if (err.code === '23505') {
    // unique_violation
    return res.status(409).json({
      error: 'Cette valeur existe déjà (contrainte d\'unicité violée).',
    });
  }

  if (err.code === '22P02') {
    // invalid_text_representation (ex. id non numérique)
    return res.status(400).json({ error: 'Identifiant ou valeur invalide.' });
  }

  // Erreur non prévue -> on log côté serveur, on ne fuite pas les détails
  console.error('Erreur non gérée :', err);
  return res.status(500).json({ error: 'Erreur interne du serveur.' });
}

module.exports = errorHandler;
