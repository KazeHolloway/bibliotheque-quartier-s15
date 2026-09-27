const express = require('express');
const router = express.Router();
const controller = require('../controllers/auteursController');
const validate = require('../middlewares/validate');

const rules = [{ field: 'nom', required: true, type: 'string' }];

router.get('/', controller.getAll);
router.get('/nationalites', controller.getNationalites);
router.get('/:id', controller.getById);
router.post('/', validate(rules), controller.create);
router.put('/:id', validate(rules), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
