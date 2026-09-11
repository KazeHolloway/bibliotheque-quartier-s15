const express = require('express');
const router = express.Router();
const controller = require('../controllers/statsController');

router.get('/', controller.getStats);

module.exports = router;
