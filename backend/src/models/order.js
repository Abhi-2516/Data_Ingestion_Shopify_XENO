const { DataTypes, Model } = require('sequelize');

class Order extends Model {
  static initModel(sequelize) {
    Order.init({
      id: { type: DataTypes.STRING, primaryKey: true }, // Shopify order id
      tenantId: { type: DataTypes.UUID, allowNull: false },
      customerId: { type: DataTypes.STRING },
      totalPrice: { type: DataTypes.FLOAT },
      createdAtShop: { type: DataTypes.DATE } // order created at Shopify
    }, { sequelize, modelName: 'order', timestamps: true, createdAt: 'createdAt', updatedAt: 'updatedAt' });
    return Order;
  }
}

module.exports = Order;
