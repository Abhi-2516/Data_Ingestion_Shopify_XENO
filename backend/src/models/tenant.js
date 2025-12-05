const { DataTypes, Model } = require('sequelize');

class Tenant extends Model {
  static initModel(sequelize) {
    Tenant.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },

        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        // Shopify store domain (e.g. mystore.myshopify.com)
        shopify_store: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        // Reserved field (unused but can store future API keys)
        api_key: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        // Webhook secret used to verify Shopify HMAC signatures
        webhook_secret: {
          type: DataTypes.STRING,
          allowNull: true,
        },

        // ⬇️ NEW FIELD — Shopify Admin API access token (OAuth token)
        shopify_token: {
          type: DataTypes.STRING,
          allowNull: true, // created after OAuth callback
        }
      },
      {
        sequelize,
        modelName: 'tenant',
        tableName: 'tenants',
      }
    );
    return Tenant;
  }
}

module.exports = Tenant;
