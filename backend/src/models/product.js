const { DataTypes, Model } = require('sequelize');

class Product extends Model {
  static initModel(sequelize) {
    Product.init({
      id: { type: DataTypes.STRING, primaryKey: true }, // Shopify product id
      tenantId: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING },
      price: { type: DataTypes.FLOAT }
    }, { sequelize, modelName: 'product' });
    return Product;
  }
}

module.exports = Product;
