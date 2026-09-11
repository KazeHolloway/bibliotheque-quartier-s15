const express = require('express');
const router = express.Router();
const controller = require('../controllers/adherentsController');
const validate = require('../middlewares/validate');

const rules = [
  { field: 'nom', required: true, type: 'string' },
  { field: 'contact', required: true, type: 'string' },
];

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/:id/emprunts', controller.getHistorique);
router.post('/', validate(rules), controller.create);
router.put('/:id', validate(rules), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
