const express = require('express');
const router = express.Router();
const { seedData } = require('../controllers/seedController');

router.post('/', seedData);
router.get('/', seedData);

module.exports = router;
