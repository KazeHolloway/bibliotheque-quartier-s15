const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/adherents
exports.getAll = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM adherents ORDER BY nom ASC');
  res.json(result.rows);
});

// GET /api/adherents/:id
exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM adherents WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Adhérent introuvable.', 404);
  }

  res.json(result.rows[0]);
});

// POST /api/adherents
exports.create = asyncHandler(async (req, res) => {
  const { nom, contact } = req.body;

  const result = await pool.query(
    'INSERT INTO adherents (nom, contact) VALUES ($1, $2) RETURNING *',
    [nom, contact]
  );

  res.status(201).json(result.rows[0]);
});

// PUT /api/adherents/:id
exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, contact } = req.body;

  const result = await pool.query(
    'UPDATE adherents SET nom = $1, contact = $2 WHERE id = $3 RETURNING *',
    [nom, contact, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Adhérent introuvable.', 404);
  }

  res.json(result.rows[0]);
});

// DELETE /api/adherents/:id
exports.remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM adherents WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Adhérent introuvable.', 404);
  }

  res.status(204).send();
});

// GET /api/adherents/:id/emprunts
// Historique complet (en cours + passés) des emprunts d'un adhérent donné.
exports.getHistorique = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const adherent = await pool.query('SELECT id FROM adherents WHERE id = $1', [id]);
  if (adherent.rows.length === 0) {
    throw new AppError('Adhérent introuvable.', 404);
  }

  // ecart_jours : négatif si rendu en avance, positif si rendu en retard, vide si pas encore rendu
  const result = await pool.query(
    `SELECT e.id, e.date_emprunt, e.date_retour_prevue, e.date_retour_effective,
            (e.date_retour_effective - e.date_retour_prevue) AS ecart_jours,
            l.id AS livre_id, l.titre AS livre_titre,
            (e.date_retour_effective IS NULL) AS en_cours,
            (e.date_retour_effective IS NULL AND e.date_retour_prevue < CURRENT_DATE) AS en_retard
      FROM emprunts e
      JOIN livres l ON l.id = e.livre_id
      WHERE e.adherent_id = $1
      ORDER BY e.date_emprunt DESC`,
    [id]
  );

  res.json(result.rows);
});
