// Middleware de logging simple : trace chaque requête entrante
// avec sa méthode, son URL, son code de statut et sa durée.
function logger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}

module.exports = logger;
