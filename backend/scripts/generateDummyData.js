const crypto = require('crypto');

const [,, TENANT_ID, NUM_CUSTOMERS = '50', NUM_ORDERS = '200'] = process.argv;

if (!TENANT_ID) {
  console.error('Usage: node scripts/generateDummyData.js <TENANT_ID> <NUM_CUSTOMERS> <NUM_ORDERS>');
  process.exit(1);
}

const BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:4000';

// Helper: fetch tenant to read webhook_secret and shop url
async function getTenant(tenantId) {
  const res = await fetch(`${BASE_URL}/api/tenants`);
  if (!res.ok) throw new Error(`Failed to fetch tenants: ${res.status}`);
  const body = await res.json().catch(() => ({}));
  const list = Array.isArray(body) ? body : (body.tenants || body);
  const tenant = (list || []).find(t => String(t.id) === String(tenantId));
  if (!tenant) throw new Error(`Tenant ${tenantId} not found via ${BASE_URL}/api/tenants`);
  return tenant;
}

function signBodyWithSecret(rawBody, secret) {
  // Shopify HMAC uses hex? they use base64 of HMAC-SHA256
  return crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const FIRST = ['Alex','Sam','Riya','Rahul','Sim','Noah','Aisha','Dev','Priya','Karan','Isha','Vik','Maya','Liam','Zara'];
const LAST  = ['Shah','Kumar','Patel','Singh','Gupta','Mehta','Rao','Verma','Jain','Bhat','Joshi'];

function randomName(i) {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 7) % LAST.length];
  return `${first} ${last}`;
}

function randomEmail(i) {
  const domains = ['example.com','demo.com','mailinator.com'];
  return `user${i}@${domains[i % domains.length]}`;
}

function randomDateWithin(daysBack) {
  const now = Date.now();
  const back = now - Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(back).toISOString();
}

function randomPrice() {
  return (Math.random() * 500 + 20).toFixed(2);
}

(async () => {
  try {
    console.log('Fetching tenant record to get webhook_secret...');
    const tenant = await getTenant(TENANT_ID);
    const secret = tenant.webhook_secret || tenant.webhookSecret || tenant.webhookSecretKey || process.env.WEBHOOK_SECRET;
    if (!secret) {
      console.error('Tenant record does not contain webhook_secret. Please set webhook_secret on the tenant.');
      console.error('Tenant fetched:', tenant);
      process.exit(1);
    }
    console.log(`Tenant found: ${tenant.name} (${tenant.shopify_store}) - using webhook secret.`);

    const numCustomers = parseInt(NUM_CUSTOMERS, 10) || 50;
    const numOrders = parseInt(NUM_ORDERS, 10) || 200;

    const customerStartId = Math.floor(10000 + Math.random() * 80000);
    const customers = Array.from({length: numCustomers}, (_, i) => {
      const nm = randomName(i).split(' ');
      return {
        id: String(customerStartId + i),
        email: randomEmail(i),
        first_name: nm[0],
        last_name: nm[1]
      };
    });

    const orders = Array.from({length: numOrders}, (_, i) => {
      const cust = customers[randInt(0, customers.length - 1)];
      return {
        id: String(500000 + i + Math.floor(Math.random()*90000)),
        customer: cust,
        total_price: randomPrice(),
        created_at: randomDateWithin(60)
      };
    });

    // send helper
    const WEBHOOK_ENDPOINT = `${BASE_URL}/api/webhooks/receive?tenantId=${TENANT_ID}`;

    async function sendWebhookSigned(payload) {
      const raw = JSON.stringify(payload);
      const hmac = signBodyWithSecret(raw, secret);
      // headers typical for Shopify-like webhooks
      const headers = {
        'Content-Type': 'application/json',
        'x-shopify-hmac-sha256': hmac,
        'x-shopify-topic': payload.type || 'order.created',
        'x-shopify-shop-domain': tenant.shopify_store || 'unknown'
      };
      try {
        const res = await fetch(WEBHOOK_ENDPOINT, { method: 'POST', headers, body: raw });
        const text = await res.text().catch(() => '');
        if (!res.ok) return { ok: false, status: res.status, text };
        return { ok: true };
      } catch (err) {
        return { ok: false, err };
      }
    }

    console.log(`Generating ${numCustomers} customers and ${numOrders} orders for tenant ${TENANT_ID}`);
    let sent = 0;
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      const payload = {
        type: 'order.created',
        data: {
          id: o.id,
          customer: {
            id: o.customer.id,
            email: o.customer.email,
            first_name: o.customer.first_name,
            last_name: o.customer.last_name
          },
          total_price: o.total_price,
          created_at: o.created_at
        }
      };

      const r = await sendWebhookSigned(payload);
      if (r.ok) sent++;
      else {
        if (r.err) console.warn(`Webhook error (network):`, r.err);
        else console.warn(`Webhook failed: status=${r.status} text=${String(r.text).slice(0,300)}`);
        await new Promise(res => setTimeout(res, 300));
      }

      if ((i + 1) % 50 === 0) {
        console.log(`  → orders sent: ${i + 1}/${orders.length}`);
        await new Promise(res => setTimeout(res, 400));
      } else if ((i + 1) % 10 === 0) {
        await new Promise(res => setTimeout(res, 120));
      }
    }

    console.log(`Done. Sent ${sent}/${orders.length} order webhooks.`);
    console.log('Refresh the frontend and select the tenant. If charts do not show immediately, try re-selecting the tenant or wait a few seconds for DB writes.');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
})();
