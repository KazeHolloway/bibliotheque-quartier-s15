const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/auteurs
exports.getAll = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM auteurs ORDER BY nom ASC');
  res.json(result.rows);
});

// GET /api/auteurs/:id
exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM auteurs WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Auteur introuvable.', 404);
  }

  res.json(result.rows[0]);
});

// POST /api/auteurs
exports.create = asyncHandler(async (req, res) => {
  const { nom, nationalite } = req.body;

  const result = await pool.query(
    'INSERT INTO auteurs (nom, nationalite) VALUES ($1, $2) RETURNING *',
    [nom, nationalite || null]
  );

  res.status(201).json(result.rows[0]);
});

// PUT /api/auteurs/:id
exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nom, nationalite } = req.body;

  const result = await pool.query(
    'UPDATE auteurs SET nom = $1, nationalite = $2 WHERE id = $3 RETURNING *',
    [nom, nationalite || null, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Auteur introuvable.', 404);
  }

  res.json(result.rows[0]);
});

// DELETE /api/auteurs/:id
exports.remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM auteurs WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Auteur introuvable.', 404);
  }

  res.status(204).send();
});
