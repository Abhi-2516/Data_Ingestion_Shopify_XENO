const express = require('express');
const router = express.Router();
const { Order } = require('../models');
const { Op } = require('sequelize');

// GET /api/export/orders.csv?tenantId=...&start=ISO&end=ISO
router.get('/orders.csv', async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.headers['x-tenant-id'];
    if (!tenantId) return res.status(400).send('tenantId required');

    const start = req.query.start ? new Date(req.query.start) : null;
    const end = req.query.end ? new Date(req.query.end) : null;

    const where = { tenantId };
    if (start && end) where.createdAtShop = { [Op.between]: [start, end] };
    else if (start) where.createdAtShop = { [Op.gte]: start };
    else if (end) where.createdAtShop = { [Op.lte]: end };

    const orders = await Order.findAll({
      where,
      order: [['createdAtShop', 'DESC']],
      limit: 5000
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders_${tenantId}.csv"`);

    // header
    res.write('id,customerId,totalPrice,createdAtShop,createdAt\\n');

    for (const o of orders) {
      const created = o.createdAtShop ? new Date(o.createdAtShop).toISOString() : '';
      const line = [
        `"${(o.id||'').toString().replace(/"/g,'""')}"`,
        `"${(o.customerId||'').toString().replace(/"/g,'""')}"`,
        `${o.totalPrice || 0}`,
        `"${created}"`,
        `"${o.createdAt ? new Date(o.createdAt).toISOString() : ''}"`
      ].join(',');
      res.write(line + '\\n');
    }
    res.end();
  } catch (err) {
    console.error('export error', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;