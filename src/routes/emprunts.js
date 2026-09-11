const express = require('express');
const router = express.Router();
const controller = require('../controllers/empruntsController');
const validate = require('../middlewares/validate');

const rules = [
  { field: 'adherent_id', required: true, type: 'number' },
  { field: 'livre_id', required: true, type: 'number' },
  { field: 'date_retour_prevue', required: true, type: 'date' },
];

router.get('/', controller.getAll);
router.get('/en-cours', controller.getEnCours);
router.get('/en-retard', controller.getEnRetard);
router.post('/', validate(rules), controller.create);
router.put('/:id/retour', controller.enregistrerRetour);

module.exports = router;
