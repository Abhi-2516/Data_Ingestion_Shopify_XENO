const { Customer, Order, Product } = require('../models');
const { Sequelize } = require('sequelize');

exports.metrics = async (req, res) => {
  try {
    // tenantId required
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });

    // totals
    const totalCustomers = await Customer.count({ where: { tenantId } });
    const totalOrders = await Order.count({ where: { tenantId }});
    const revenueRes = await Order.findAll({
      where: { tenantId },
      attributes: [[Sequelize.fn('SUM', Sequelize.col('totalPrice')), 'revenue']]
    });
    const revenue = parseFloat(revenueRes[0].get('revenue')) || 0;

    // orders by date (last 30 days aggregated)
    const ordersByDate = await Order.findAll({
      where: { tenantId },
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAtShop')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('totalPrice')), 'revenue']
      ],
      group: ['date'],
      order: [[Sequelize.literal('date'), 'ASC']],
      limit: 100
    });

    // top 5 customers by spend
    const topCustomers = await Customer.findAll({
      where: { tenantId },
      order: [['totalSpent', 'DESC']],
      limit: 5
    });

    res.json({ totalCustomers, totalOrders, revenue, ordersByDate, topCustomers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
