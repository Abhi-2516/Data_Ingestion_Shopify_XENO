const { DataTypes, Model } = require('sequelize');
class User extends Model {
  static initModel(sequelize) {
    User.init({
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING }
    }, { sequelize, modelName: 'user' });
    return User;
  }
}
module.exports = User;
