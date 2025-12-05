const { Tenant, Customer, Order, Product, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
async function seed() {
  try {
    await sequelize.sync({ alter: true });
    // create demo tenant if not exists
    let tenant = await Tenant.findOne({ where: { name: 'Demo Store' }});
    if (!tenant) {
      tenant = await Tenant.create({
        name: 'Demo Store',
        shopify_store: 'demo-store.myshopify.com',
        webhook_secret: 'secret123'
      });
    }
    // create some customers
    const customers = [];
     for (let i=0;i<10;i++) {
      const id = (10000 + i).toString();
      const c = await Customer.upsert({
        id,
        tenantId: tenant.id,
        email: `user${i}@example.com`,
        firstName: `User${i}`,
        lastName: 'Demo',
        totalSpent: 0
      });
      customers.push(id);
    }
    // create random orders over last 30 days
    const now = new Date();
    for (let i=0;i<50;i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(now.getTime() - daysAgo * 24*60*60*1000);
      const cust = customers[Math.floor(Math.random() * customers.length)];
      const orderId = (500000 + i).toString();
      const total = (Math.random() * 200 + 10).toFixed(2);
      await Order.upsert({
        id: orderId,
        tenantId: tenant.id,
        customerId: cust,
        totalPrice: parseFloat(total),
        createdAtShop: date
      });
      // update customer's totalSpent
      const c = await Customer.findByPk(cust);
      if (c) {
        c.totalSpent = (c.totalSpent || 0) + parseFloat(total);
        await c.save();
      }
    }
    console.log('Seeding complete. Tenant id:', tenant.id);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
}
seed();
