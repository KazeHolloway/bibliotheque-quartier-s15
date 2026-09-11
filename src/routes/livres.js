const express = require('express');
const router = express.Router();
const controller = require('../controllers/livresController');
const validate = require('../middlewares/validate');

const rules = [
  { field: 'titre', required: true, type: 'string' },
  { field: 'auteur_id', required: true, type: 'number' },
];

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(rules), controller.create);
router.put('/:id', validate(rules), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
