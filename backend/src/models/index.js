const sequelize = require('../config/db');
const Tenant = require('./tenant');
const Customer = require('./customer');
const Product = require('./product');
const Order = require('./order');
const Event = require('./event');
const User = require('./user');
// Initialize models with sequelize instance
Tenant.initModel(sequelize);
Customer.initModel(sequelize);
Product.initModel(sequelize);
Order.initModel(sequelize);
Event.initModel(sequelize);
User.initModel(sequelize);
// relations
Tenant.hasMany(Customer, { foreignKey: 'tenantId' });
Customer.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(Product, { foreignKey: 'tenantId' });
Product.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(Order, { foreignKey: 'tenantId' });
Order.belongsTo(Tenant, { foreignKey: 'tenantId' });
Customer.hasMany(Order, { foreignKey: 'customerId' });
Order.belongsTo(Customer, { foreignKey: 'customerId' });
module.exports = {
  sequelize,
  Tenant,
  Customer,
  Product,
  Order,
  Event,
  User
};
