const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/stats
exports.getStats = asyncHandler(async (req, res) => {
  const [
    totalLivres,
    totalAdherents,
    empruntsEnCours,
    empruntsEnRetard,
    livrePlusEmprunte,
    adherentLePlusActif,
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM livres'),
    pool.query('SELECT COUNT(*) FROM adherents'),
    pool.query('SELECT COUNT(*) FROM emprunts WHERE date_retour_effective IS NULL'),
    pool.query(
      `SELECT COUNT(*) FROM emprunts
       WHERE date_retour_effective IS NULL AND date_retour_prevue < CURRENT_DATE`
    ),
    pool.query(
      `SELECT l.id, l.titre, COUNT(*) AS nombre_emprunts
       FROM emprunts e
       JOIN livres l ON l.id = e.livre_id
       GROUP BY l.id, l.titre
       ORDER BY nombre_emprunts DESC
       LIMIT 1`
    ),
    pool.query(
      `SELECT a.id, a.nom, COUNT(*) AS nombre_emprunts
       FROM emprunts e
       JOIN adherents a ON a.id = e.adherent_id
       GROUP BY a.id, a.nom
       ORDER BY nombre_emprunts DESC
       LIMIT 1`
    ),
  ]);

  res.json({
    total_livres: parseInt(totalLivres.rows[0].count, 10),
    total_adherents: parseInt(totalAdherents.rows[0].count, 10),
    emprunts_en_cours: parseInt(empruntsEnCours.rows[0].count, 10),
    emprunts_en_retard: parseInt(empruntsEnRetard.rows[0].count, 10),
    livre_le_plus_emprunte: livrePlusEmprunte.rows[0] || null,
    adherent_le_plus_actif: adherentLePlusActif.rows[0] || null,
  });
});
