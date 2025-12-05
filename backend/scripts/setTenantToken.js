/**
 * backend/scripts/setTenantToken.js
 * Usage:
 *   node scripts/setTenantToken.js <TENANT_ID> "<ADMIN_API_TOKEN>"
 *
 * This script reads DATABASE_URL from ../.env, connects with Sequelize, and updates
 * the tenants table setting shopify_token for the given tenant id.
 *
 * IMPORTANT: keep your Admin API token secret. Don't paste it publicly.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Sequelize, DataTypes } = require('sequelize');
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/setTenantToken.js <TENANT_ID> "<ADMIN_API_TOKEN>"');
    process.exit(1);
  }
  const [tenantId, token] = args;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not found in .env');
    process.exit(2);
  }
  // Connect to DB
  const sequelize = new Sequelize(dbUrl, {
    logging: false,
    dialectOptions: { connectTimeout: 30000 }
  });
  // Minimal Tenant model to update the token
  const Tenant = sequelize.define('tenant', {
    id: { type: DataTypes.UUID, primaryKey: true },
    shopify_token: { type: DataTypes.TEXT }
  }, {
    tableName: 'tenants',
    timestamps: false
  });
  try {
    await sequelize.authenticate();
    // ensure table exists (no changes are made)
    // update the tenant
    const [updatedCount] = await Tenant.update(
      { shopify_token: token },
      { where: { id: tenantId } }
    );
    if (updatedCount === 0) {
      console.error('No tenant updated. Check tenant id is correct.');
      process.exit(3);
    }
    console.log('✅ Token saved for tenant', tenantId);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    await sequelize.close().catch(()=>{});
    process.exit(4);
  }
}
main();
