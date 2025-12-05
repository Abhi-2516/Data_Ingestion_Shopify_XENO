const { DataTypes, Model } = require('sequelize');

class Customer extends Model {
  static initModel(sequelize) {
    Customer.init({
      id: { type: DataTypes.STRING, primaryKey: true }, // use Shopify id if available
      tenantId: { type: DataTypes.UUID, allowNull: false },
      email: { type: DataTypes.STRING },
      firstName: { type: DataTypes.STRING },
      lastName: { type: DataTypes.STRING },
      totalSpent: { type: DataTypes.FLOAT, defaultValue: 0 }
    }, { sequelize, modelName: 'customer' });
    return Customer;
  }
}

module.exports = Customer;
