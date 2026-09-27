const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const SELECT_EMPRUNT_DETAIL = `
  SELECT e.id, e.date_emprunt, e.date_retour_prevue, e.date_retour_effective,
        a.id AS adherent_id, a.nom AS adherent_nom, a.contact AS adherent_contact,
        l.id AS livre_id, l.titre AS livre_titre,
        (e.date_retour_effective IS NULL AND e.date_retour_prevue < CURRENT_DATE) AS en_retard
  FROM emprunts e
  JOIN adherents a ON a.id = e.adherent_id
  JOIN livres l ON l.id = e.livre_id
`;

// GET /api/emprunts
exports.getAll = asyncHandler(async (req, res) => {
  const result = await pool.query(`${SELECT_EMPRUNT_DETAIL} ORDER BY e.date_emprunt DESC`);
  res.json(result.rows);
});

// GET /api/emprunts/en-cours?q=...&statut=en-retard&page=1&limit=8
// Liste paginee et filtree des emprunts non rendus, avec recherche par titre de livre ou nom d'adherent.
exports.getEnCours = asyncHandler(async (req, res) => {
  const { q, statut } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;

  const conditions = ['e.date_retour_effective IS NULL'];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(l.titre ILIKE $${params.length} OR a.nom ILIKE $${params.length})`);
  }

  if (statut === 'en-retard') {
    conditions.push('e.date_retour_prevue < CURRENT_DATE');
  } else if (statut === 'en-cours') {
    conditions.push('e.date_retour_prevue >= CURRENT_DATE');
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const baseQuery = `FROM emprunts e JOIN adherents a ON a.id = e.adherent_id JOIN livres l ON l.id = e.livre_id ${whereClause}`;

  const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const dataParams = [...params, limit, offset];
  const limitPlaceholder = `$${params.length + 1}`;
  const offsetPlaceholder = `$${params.length + 2}`;

  const dataResult = await pool.query(
    `${SELECT_EMPRUNT_DETAIL} ${whereClause} ORDER BY e.date_retour_prevue ASC LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
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

// GET /api/emprunts/en-retard
exports.getEnRetard = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `${SELECT_EMPRUNT_DETAIL}
    WHERE e.date_retour_effective IS NULL AND e.date_retour_prevue < CURRENT_DATE
    ORDER BY e.date_retour_prevue ASC`
  );
  res.json(result.rows);
});

// POST /api/emprunts
// Règle métier : un emprunt ne peut pas être créé si le livre est déjà
// emprunté. La création + le passage du livre à "emprunté" doivent être
// atomiques -> on utilise une transaction SQL.
exports.create = asyncHandler(async (req, res) => {
  const { adherent_id, livre_id, date_retour_prevue } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const adherent = await client.query('SELECT id FROM adherents WHERE id = $1', [adherent_id]);
    if (adherent.rows.length === 0) {
      throw new AppError("L'adhérent indiqué n'existe pas.", 400);
    }

    // SELECT ... FOR UPDATE : verrouille la ligne le temps de la transaction
    // pour éviter que deux emprunts soient créés en même temps sur le même livre.
    const livre = await client.query(
      'SELECT id, disponible FROM livres WHERE id = $1 FOR UPDATE',
      [livre_id]
    );
    if (livre.rows.length === 0) {
      throw new AppError("Le livre indiqué n'existe pas.", 400);
    }
    if (!livre.rows[0].disponible) {
      throw new AppError('Ce livre est déjà emprunté.', 409);
    }

    const emprunt = await client.query(
      `INSERT INTO emprunts (adherent_id, livre_id, date_retour_prevue)
       VALUES ($1, $2, $3) RETURNING *`,
      [adherent_id, livre_id, date_retour_prevue]
    );

    await client.query('UPDATE livres SET disponible = FALSE WHERE id = $1', [livre_id]);

    await client.query('COMMIT');
    res.status(201).json(emprunt.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PUT /api/emprunts/:id/retour
// Enregistre le retour d'un livre : marque l'emprunt comme terminé et
// repasse le livre à "disponible" (même logique transactionnelle).
exports.enregistrerRetour = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const emprunt = await client.query('SELECT * FROM emprunts WHERE id = $1 FOR UPDATE', [id]);
    if (emprunt.rows.length === 0) {
      throw new AppError('Emprunt introuvable.', 404);
    }
    if (emprunt.rows[0].date_retour_effective !== null) {
      throw new AppError('Ce livre a déjà été rendu.', 409);
    }

    const updated = await client.query(
      `UPDATE emprunts SET date_retour_effective = CURRENT_DATE
       WHERE id = $1 RETURNING *`,
      [id]
    );

    await client.query('UPDATE livres SET disponible = TRUE WHERE id = $1', [
      emprunt.rows[0].livre_id,
    ]);

    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});
