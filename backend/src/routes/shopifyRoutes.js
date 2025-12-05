const express = require('express');
const router = express.Router();
const shopifyController = require('../controllers/shopifyController');
router.get('/install', shopifyController.install);
router.get('/callback', shopifyController.callback);
router.post('/backfill', shopifyController.backfill);
router.post('/backfill/queue', shopifyController.backfillQueue);
module.exports = router;
