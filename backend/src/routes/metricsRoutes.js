const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metricsController');

router.get('/summary', metricsController.metrics);

module.exports = router;
