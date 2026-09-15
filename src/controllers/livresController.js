const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/livres?q=...&page=1&limit=10&sort=annee_asc&dispo_first=true
// Recherche par titre ou nom d'auteur (paramètre q), avec pagination et tri optionnel.
exports.getAll = asyncHandler(async (req, res) => {
  const { q, sort, dispo_first } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;

  const baseQuery = `
    FROM livres l
    JOIN auteurs a ON a.id = l.auteur_id
    ${q ? 'WHERE l.titre ILIKE $1 OR a.nom ILIKE $1' : ''}
  `;
  const params = q ? [`%${q}%`] : [];

  const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  // construit la clause ORDER BY a partir d'une liste blanche de criteres fixes,
  // jamais depuis une valeur brute envoyee par l'utilisateur, pour rester a l'abri des injections SQL
  const criteresTri = [];
  if (dispo_first === 'true') criteresTri.push('l.disponible DESC');
  if (sort === 'annee_asc') {
    criteresTri.push('l.annee_publication ASC NULLS LAST');
  } else if (sort === 'annee_desc') {
    criteresTri.push('l.annee_publication DESC NULLS LAST');
  } else if (sort === 'titre_desc') {
    criteresTri.push('l.titre DESC');
  } else {
    criteresTri.push('l.titre ASC');
  }
  const orderByClause = criteresTri.join(', ');

  const dataParams = q ? [...params, limit, offset] : [limit, offset];
  const limitPlaceholder = q ? '$2' : '$1';
  const offsetPlaceholder = q ? '$3' : '$2';

  const dataResult = await pool.query(
    `SELECT l.id, l.titre, l.annee_publication, l.disponible,
            a.id AS auteur_id, a.nom AS auteur_nom
     ${baseQuery}
     ORDER BY ${orderByClause}
     LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
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

// GET /api/livres/:id
exports.getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT l.id, l.titre, l.annee_publication, l.disponible,
            a.id AS auteur_id, a.nom AS auteur_nom
     FROM livres l
     JOIN auteurs a ON a.id = l.auteur_id
     WHERE l.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Livre introuvable.', 404);
  }

  res.json(result.rows[0]);
});

// POST /api/livres
exports.create = asyncHandler(async (req, res) => {
  const { titre, auteur_id, annee_publication } = req.body;

  const auteur = await pool.query('SELECT id FROM auteurs WHERE id = $1', [auteur_id]);
  if (auteur.rows.length === 0) {
    throw new AppError("L'auteur indiqué n'existe pas.", 400);
  }

  const result = await pool.query(
    `INSERT INTO livres (titre, auteur_id, annee_publication)
     VALUES ($1, $2, $3) RETURNING *`,
    [titre, auteur_id, annee_publication || null]
  );

  res.status(201).json(result.rows[0]);
});

// PUT /api/livres/:id
exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { titre, auteur_id, annee_publication } = req.body;

  if (auteur_id) {
    const auteur = await pool.query('SELECT id FROM auteurs WHERE id = $1', [auteur_id]);
    if (auteur.rows.length === 0) {
      throw new AppError("L'auteur indiqué n'existe pas.", 400);
    }
  }

  const result = await pool.query(
    `UPDATE livres SET titre = $1, auteur_id = $2, annee_publication = $3
     WHERE id = $4 RETURNING *`,
    [titre, auteur_id, annee_publication || null, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Livre introuvable.', 404);
  }

  res.json(result.rows[0]);
});

// DELETE /api/livres/:id
exports.remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM livres WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Livre introuvable.', 404);
  }

  res.status(204).send();
});
