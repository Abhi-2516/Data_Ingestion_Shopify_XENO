const { Tenant } = require('../models');

exports.createTenant = async (req, res) => {
  try {
    const { name, shopify_store, webhook_secret } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const tenant = await Tenant.create({ name, shopify_store, webhook_secret });
    res.json({ tenant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

exports.listTenants = async (req, res) => {
  const tenants = await Tenant.findAll();
  res.json({ tenants });
};
