const { Customer, Order, Product, Event, Tenant } = require('../models');
const { verifySignature } = require('../utils/verifyWebhook');
exports.receiveWebhook = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required in header x-tenant-id or query' });
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) return res.status(400).json({ error: 'invalid tenantId' });
    // allow simulated calls for demo if header set
    const allowSim = (req.headers['x-allow-sim'] === 'true');
    // signature verification if tenant has webhook_secret
    if (tenant.webhook_secret && !allowSim) {
      const signature = req.headers['x-webhook-signature'] || req.headers['x-shopify-hmac-sha256'] || '';
      const ok = verifySignature(req.rawBody || Buffer.from(''), signature, tenant.webhook_secret);
      if (!ok) {
        return res.status(401).json({ error: 'signature verification failed' });
      }
    }
    const { type, data } = req.body;
    if (!type || !data) return res.status(400).json({ error: 'type and data required' });
    await Event.create({ tenantId, eventType: type, payload: data });
    const safeId = (v) => (v === null || v === undefined) ? null : String(v);
    if (type === 'customer.created' || type === 'customers/create') {
      const customerId = safeId(data.id);
      await Customer.upsert({
        id: customerId,
        tenantId,
        email: data.email || data.email_address || null,
        firstName: data.first_name || data.firstName || null,
        lastName: data.last_name || data.lastName || null
      });
    } else if (type === 'product.created' || type === 'products/create') {
      const productId = safeId(data.id);
      await Product.upsert({
        id: productId,
        tenantId,
        title: data.title,
        price: parseFloat((data.variants && data.variants[0] && data.variants[0].price) || data.price || 0) || 0
      });
    } else if (type === 'order.created' || type === 'orders/create') {
      const rawCustId = data.customer && (data.customer.id || data.customer.id === 0) ? data.customer.id : null;
      const customerId = safeId(rawCustId);
      if (customerId) {
        await Customer.upsert({
          id: customerId,
          tenantId,
          email: (data.customer && (data.customer.email || data.customer.email_address)) || null,
          firstName: (data.customer && (data.customer.first_name || data.customer.firstName)) || null,
          lastName: (data.customer && (data.customer.last_name || data.customer.lastName)) || null
        });
      }
      const orderPayload = {
        id: safeId(data.id),
        tenantId,
        customerId: customerId,
        totalPrice: parseFloat(data.total_price || data.totalPrice) || 0,
        createdAtShop: data.created_at || new Date()
      };
      await Order.upsert(orderPayload);
      if (customerId) {
        const customer = await Customer.findByPk(customerId);
        if (customer) {
          customer.totalSpent = (customer.totalSpent || 0) + (parseFloat(data.total_price || data.totalPrice) || 0);
          await customer.save();
        }
      }
    }
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('webhook error', err);
    return res.status(500).json({ error: 'server error' });
  }
};
