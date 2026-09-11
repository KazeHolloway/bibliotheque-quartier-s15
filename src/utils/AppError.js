/**
 * Erreur applicative "métier", avec un code HTTP explicite.
 * On la lance dans les controllers pour signaler un cas prévu
 * (ressource introuvable, validation échouée, règle métier
 * violée...) et le middleware errorHandler s'occupe de
 * transformer ça en réponse JSON propre.
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isAppError = true;
  }
}

module.exports = AppError;
