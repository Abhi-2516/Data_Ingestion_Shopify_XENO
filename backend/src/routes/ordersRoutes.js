// src/routes/ordersRoutes.js
const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');

// GET /api/orders/recent?tenantId=...
router.get('/recent', ordersController.recent);

// GET /api/orders?tenantId=...&limit=&offset=&start=&end=
router.get('/', ordersController.list);

module.exports = router;
