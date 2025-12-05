const { DataTypes, Model } = require('sequelize');

class Event extends Model {
  static initModel(sequelize) {
    Event.init({
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      tenantId: { type: DataTypes.UUID, allowNull: false },
      eventType: { type: DataTypes.STRING },
      payload: { type: DataTypes.JSONB }
    }, { sequelize, modelName: 'event' });
    return Event;
  }
}

module.exports = Event;
