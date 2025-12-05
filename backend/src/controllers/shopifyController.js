const fetch = require('node-fetch');
const { Tenant, Customer, Product, Order } = require('../models');
const querystring = require('querystring');

const API_KEY = process.env.SHOPIFY_API_KEY;
const API_SECRET = process.env.SHOPIFY_API_SECRET;
const SCOPES = process.env.SHOPIFY_SCOPES || 'read_products,read_customers,read_orders';
const APP_URL = process.env.APP_URL || 'http://localhost:4000';

// helper to safely parse json or return text
async function safeParse(res) {
  const text = await res.text().catch(() => '');
  try {
    return { ok: res.ok, json: JSON.parse(text), text };
  } catch (e) {
    return { ok: res.ok, json: null, text };
  }
}

exports.install = async (req, res) => {
  try {
    const shop = req.query.shop;
    if (!shop) return res.status(400).send('Missing shop query param (e.g. dev-store.myshopify.com)');
    const state = Math.random().toString(36).slice(2);
    const redirect = `https://${shop}/admin/oauth/authorize?client_id=${API_KEY}&scope=${encodeURIComponent(SCOPES)}&redirect_uri=${encodeURIComponent(APP_URL + '/api/shopify/callback')}&state=${state}`;
    return res.redirect(redirect);
  } catch (err) {
    console.error('shopify install error', err);
    return res.status(500).json({ error: 'server error' });
  }
};

exports.callback = async (req, res) => {
  try {
    const { shop, code } = req.query;
    if (!shop || !code) return res.status(400).send('Missing shop or code');

    const url = `https://${shop}/admin/oauth/access_token`;
    const body = { client_id: API_KEY, client_secret: API_SECRET, code };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow'
    });

    // Safely parse response
    const parsed = await safeParse(r);
    if (!r.ok) {
      console.error('shopify token exchange failed', { status: r.status, body: parsed.text });
      return res.status(500).send(`Shopify token exchange failed: ${r.status} - ${parsed.text}`);
    }

    const data = parsed.json || {};
    if (!data.access_token) {
      console.error('no access_token in response', { body: parsed.text, parsed });
      return res.status(500).send('No access_token returned by Shopify. Check API key/secret and redirect URL.');
    }

    const token = data.access_token;
    let tenant = await Tenant.findOne({ where: { shopify_store: shop } });
    if (!tenant) {
      tenant = await Tenant.create({ name: shop, shopify_store: shop, webhook_secret: null, shopify_token: token });
    } else {
      tenant.shopify_token = token;
      await tenant.save();
    }

    // respond with a simple HTML page
    return res.send(`<h3>App installed for ${shop}</h3><p>Tenant id: ${tenant.id}</p><p>Close this window and return to the app dashboard.</p>`);
  } catch (err) {
    console.error('shopify callback error', err);
    return res.status(500).json({ error: 'server error', detail: err.message });
  }
};

// Helper to call Shopify Admin REST API with pagination and better errors
async function shopifyGetAll(shop, token, path, params = {}) {
  const results = [];
  const perPage = 250;
  let url = `https://${shop}/admin/api/2024-07/${path}.json?limit=${perPage}`;
  if (params && Object.keys(params).length) url += '&' + querystring.stringify(params);

  while (true) {
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
      redirect: 'follow'
    });

    // read text so we can debug if not JSON
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      console.error('Shopify API error', { url, status: res.status, body: text });
      throw new Error(`Shopify API error ${res.status}: ${text}`);
    }

    // parse JSON robustly
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON from Shopify', { url, status: res.status, body: text });
      throw new Error(`Invalid JSON from Shopify: ${text}`);
    }

    const key = Object.keys(json).find(k => Array.isArray(json[k]));
    if (!key) break;
    results.push(...json[key]);

    // Pagination: use Link header
    const link = res.headers.get('link');
    if (link && link.includes('rel=\"next\"')) {
      const match = /<([^>]+)>; rel=\"next\"/.exec(link);
      if (match && match[1]) {
        url = match[1];
      } else {
        break;
      }
    } else {
      break;
    }

    // friendly delay
    await new Promise(r => setTimeout(r, 500));
  }

  return results;
}

exports.backfill = async (req, res) => {
  try {
    const tenantId = req.body.tenantId || req.query.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant || !tenant.shopify_store || !tenant.shopify_token) {
      return res.status(400).json({ error: 'tenant not configured with shopify_store and shopify_token' });
    }
    const shop = tenant.shopify_store;
    const token = tenant.shopify_token;

    // customers
    const customers = await shopifyGetAll(shop, token, 'customers');
    for (const c of customers) {
      await Customer.upsert({
        id: String(c.id),
        tenantId,
        email: c.email || null,
        firstName: c.first_name || null,
        lastName: c.last_name || null,
        totalSpent: parseFloat(c.total_spent || 0)
      });
    }

    // products
    const products = await shopifyGetAll(shop, token, 'products');
    for (const p of products) {
      await Product.upsert({
        id: String(p.id),
        tenantId,
        title: p.title,
        price: parseFloat((p.variants && p.variants[0] && p.variants[0].price) || 0)
      });
    }

    // orders
    const orders = await shopifyGetAll(shop, token, 'orders', { status: 'any' });
    for (const o of orders) {
      const customerId = o.customer ? String(o.customer.id) : null;
      await Order.upsert({
        id: String(o.id),
        tenantId,
        customerId,
        totalPrice: parseFloat(o.total_price || 0),
        createdAtShop: o.created_at
      });
      if (customerId) {
        const cust = await Customer.findByPk(customerId);
        if (cust) {
          cust.totalSpent = (cust.totalSpent || 0) + (parseFloat(o.total_price || 0) || 0);
          await cust.save();
        }
      }
    }

    return res.json({ status: 'ok', counts: { customers: customers.length, products: products.length, orders: orders.length }});
  } catch (err) {
    console.error('shopify backfill error', err);
    return res.status(500).json({ error: 'server error', detail: err.message });
  }
};

exports.backfillQueue = async (req, res) => {
  return exports.backfill(req, res);
};