const path = require('path');
const express = require('express');
const cors = require('cors');

const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');

const auteursRoutes = require('./routes/auteurs');
const adherentsRoutes = require('./routes/adherents');
const livresRoutes = require('./routes/livres');
const empruntsRoutes = require('./routes/emprunts');
const statsRoutes = require('./routes/stats');

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);

// Sert le frontend (HTML/CSS/JS) depuis le dossier public/
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auteurs', auteursRoutes);
app.use('/api/adherents', adherentsRoutes);
app.use('/api/livres', livresRoutes);
app.use('/api/emprunts', empruntsRoutes);
app.use('/api/stats', statsRoutes);

// 404 pour toute route non reconnue
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée.' });
});

// Middleware de gestion d'erreurs (toujours en dernier)
app.use(errorHandler);

module.exports = app;
