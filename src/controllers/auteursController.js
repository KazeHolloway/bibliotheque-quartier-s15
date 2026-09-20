const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/auteurs (tableau complet) ou GET /api/auteurs?q=...&nationalite=...&page=1&limit=8 (liste paginee et filtree)
exports.getAll = asyncHandler(async (req, res) => {
  const { q, nationalite, page: pageParam, limit: limitParam } = req.query;

  // aucun filtre ni pagination demande : on garde l'ancien format (tableau complet),
  // pour ne pas casser les selecteurs d'auteurs des pages Livres et Emprunts
  if (!q && !nationalite && !pageParam && !limitParam) {
    const result = await pool.query('SELECT * FROM auteurs ORDER BY nom ASC');
    return res.json(result.rows);
  }

  const page = Math.max(parseInt(pageParam, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`nom ILIKE $${params.length}`);
  }

  if (nationalite) {
    params.push(nationalite.trim());
    conditions.push(`LOWER(TRIM(nationalite)) = LOWER($${params.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(`SELECT COUNT(*) FROM auteurs ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const dataParams = [...params, limit, offset];
  const limitPlaceholder = `$${params.length + 1}`;
  const offsetPlaceholder = `$${params.length + 2}`;

  const dataResult = await pool.query(
    `SELECT * FROM auteurs ${whereClause} ORDER BY nom ASC LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    dataParams
  );

  res.json({
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

// GET /api/auteurs/nationalites
// Liste des nationalites distinctes reellement presentes en base, en regroupant
// les variantes de casse et d'espaces ("congolaise" et " Congolaise " comptent comme une seule).
exports.getNationalites = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT MIN(TRIM(nationalite)) AS nationalite
      FROM auteurs
      WHERE nationalite IS NOT NULL AND TRIM(nationalite) <> ''
      GROUP BY LOWER(TRIM(nationalite))
      ORDER BY MIN(TRIM(nationalite)) ASC`
  );
  res.json(result.rows.map((row) => row.nationalite));
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
