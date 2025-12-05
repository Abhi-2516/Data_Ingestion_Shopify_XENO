const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

router.post('/create', tenantController.createTenant);
router.get('/', tenantController.listTenants);

module.exports = router;
