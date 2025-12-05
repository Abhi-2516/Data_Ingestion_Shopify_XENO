// src/controllers/ordersController.js
const { Order, Customer } = require('../models');
const { Op } = require('sequelize');

exports.recent = async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.headers['x-tenant-id'];
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    const limit = Math.min(100, parseInt(req.query.limit || 10, 10));
    const orders = await Order.findAll({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
      limit,
      include: [{ model: Customer, attributes: ['id','email','firstName','lastName'] }]
    });

    res.json({ orders });
  } catch (err) {
    console.error('recent orders error', err);
    res.status(500).json({ error: 'server error' });
  }
};

exports.list = async (req, res) => {
  try {
    const tenantId = req.query.tenantId || req.headers['x-tenant-id'];
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    const limit = Math.min(5000, parseInt(req.query.limit || 100, 10));
    const offset = parseInt(req.query.offset || 0, 10);

    const where = { tenantId };
    // optional date range filter using createdAtShop
    if (req.query.start && req.query.end) {
      where.createdAtShop = { [Op.between]: [new Date(req.query.start), new Date(req.query.end)] };
    } else if (req.query.start) {
      where.createdAtShop = { [Op.gte]: new Date(req.query.start) };
    } else if (req.query.end) {
      where.createdAtShop = { [Op.lte]: new Date(req.query.end) };
    }

    const orders = await Order.findAll({
      where,
      order: [['createdAtShop','DESC']],
      limit,
      offset,
      include: [{ model: Customer, attributes: ['id','email','firstName','lastName'] }]
    });

    res.json({ orders });
  } catch (err) {
    console.error('orders list error', err);
    res.status(500).json({ error: 'server error' });
  }
};
