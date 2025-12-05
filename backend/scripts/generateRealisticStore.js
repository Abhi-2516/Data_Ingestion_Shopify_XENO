
const crypto = require('crypto');

const [,, TENANT_ID, NUM_PRODUCTS = '40', NUM_CUSTOMERS = '150', NUM_ORDERS = '800'] = process.argv;
if (!TENANT_ID) {
  console.error('Usage: node scripts/generateRealisticStore.js <TENANT_ID> <NUM_PRODUCTS> <NUM_CUSTOMERS> <NUM_ORDERS>');
  process.exit(1);
}

const BASE_URL = process.env.BACKEND_URL || 'http://127.0.0.1:4000';

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const ADJ_PRODUCTS = [
  'Hoodie', 'T-Shirt', 'Sneakers', 'Cap', 'Backpack', 'Socks', 'Watch', 'Phone Case',
  'Mug', 'Notebook', 'Sunglasses', 'Jeans', 'Jacket', 'Dress', 'Scarf', 'Belt'
];
const BRANDS = ['Lumen', 'Northo', 'XenoWear', 'Mono', 'Atlas', 'Hatch'];
const CATEGORIES = ['Apparel','Footwear','Accessories','Home','Electronics'];

const FIRST = ['Alex','Sam','Riya','Rahul','Sim','Noah','Aisha','Dev','Priya','Karan','Isha','Vik','Maya','Liam','Zara','Mohan','Anya'];
const LAST  = ['Shah','Kumar','Patel','Singh','Gupta','Mehta','Rao','Verma','Jain','Bhat','Joshi','Kapoor'];

function makeProduct(i) {
  const base = randChoice(ADJ_PRODUCTS);
  const brand = randChoice(BRANDS);
  const name = `${brand} ${base}${i>0? ' ' + (i+1):''}`;
  const category = randChoice(CATEGORIES);
  const price = (Math.random()*80 + 10).toFixed(2); // 10 - 90
  const sku = `SKU-${String(1000 + i)}`;
  const id = String(100000 + i);
  return { id, name, sku, price, category };
}

function makeCustomer(i) {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i*7) % LAST.length];
  const id = String(20000 + i);
  const email = `cust${i}@demo.com`;
  // some customers flagged as repeat buyers
  const repeatScore = Math.random(); // >0.75 => high repeat
  const repeatFactor = repeatScore > 0.85 ? randInt(3,8) : (repeatScore > 0.6 ? randInt(2,4) : 1);
  const city = randChoice(['Mumbai','Delhi','Bengaluru','Chennai','Kolkata','Hyderabad','Pune','Jaipur']);
  return { id, first_name: first, last_name: last, email, repeatFactor, city };
}

/** date generator with seasonality:
 * skew towards weekends and end-of-month spikes
 */
function randomDateWithSeason(daysBack = 90) {
  const now = new Date();
  // prefer recent days: sample u^2 to bias towards now
  let u = Math.random();
  u = Math.pow(u, 1.6); // bias to recent
  let offset = Math.floor(u * daysBack);
  const d = new Date(now.getTime() - offset*24*3600*1000);

  // add weekend boost: with small chance, bump to nearest weekend
  if (Math.random() < 0.18) { // 18% weekend boost
    const dow = d.getDay();
    const toSat = (6 - dow + 7) % 7;
    d.setDate(d.getDate() + toSat);
  }

  // monthly spike: end-of-month higher chance
  const day = d.getDate();
  if (day > 24 && Math.random() < 0.25) {
    // boost to last few days of the month
    d.setDate(d.getDate() + randInt(0, Math.max(0, 4)));
  }

  // times during day: higher during afternoon/evening
  const hour = randInt(10, 22); // 10am to 10pm
  const minute = randInt(0,59);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// HMAC signing (Shopify-style base64)
function signBody(secret, bodyString) {
  return crypto.createHmac('sha256', secret).update(bodyString, 'utf8').digest('base64');
}

// fetch tenant record to get webhook_secret + shop domain
async function getTenant(tenantId) {
  const res = await fetch(`${BASE_URL}/api/tenants`);
  if (!res.ok) throw new Error('Failed to fetch tenants list');
  const body = await res.json().catch(()=> ({}));
  const list = Array.isArray(body) ? body : (body.tenants || body);
  const tenant = (list || []).find(t => String(t.id) === String(tenantId));
  if (!tenant) throw new Error('Tenant not found: ' + tenantId);
  return tenant;
}

// send webhook signed
async function sendSigned(payload, tenant, secret) {
  const raw = JSON.stringify(payload);
  const hmac = signBody(secret, raw);
  const headers = {
    'Content-Type': 'application/json',
    'x-shopify-hmac-sha256': hmac,
    'x-shopify-topic': payload.type || 'order.created',
    'x-shopify-shop-domain': tenant.shopify_store || 'local.dev'
  };
  try {
    const res = await fetch(`${BASE_URL}/api/webhooks/receive?tenantId=${TENANT_ID}`, { method: 'POST', headers, body: raw });
    const txt = await res.text().catch(()=>'');
    if (!res.ok) return { ok:false, status: res.status, text: txt };
    return { ok:true };
  } catch (err) {
    return { ok:false, err };
  }
}

// main runner
(async () => {
  try {
    console.log('Fetching tenant...');
    const tenant = await getTenant(TENANT_ID);
    const secret = tenant.webhook_secret || tenant.webhookSecret || process.env.WEBHOOK_SECRET;
    if (!secret) {
      console.error('Tenant webhook_secret not found. Set webhook_secret on the tenant first.');
      console.log('Tenant record:', tenant);
      process.exit(1);
    }
    console.log(`Tenant: ${tenant.name} (${tenant.shopify_store})`);

    const P = parseInt(NUM_PRODUCTS, 10);
    const C = parseInt(NUM_CUSTOMERS, 10);
    const O = parseInt(NUM_ORDERS, 10);

    // build product catalog
    const products = Array.from({length: P}, (_, i) => makeProduct(i));
    // build customers
    const customers = Array.from({length: C}, (_, i) => makeCustomer(i));

    console.log(`Generating ${P} products, ${C} customers, ${O} orders (multi-item, repeat buyers, seasonal)`);
    let sent = 0;

    // create a weighted customer queue to simulate repeat buyers:
    // produce an array where customers appear repeatFactor times
    const customerPool = [];
    customers.forEach(c => {
      const freq = Math.max(1, Math.round(c.repeatFactor));
      for (let k=0;k<freq;k++) customerPool.push(c);
    });

    for (let i = 0; i < O; i++) {
      // pick a customer from pool (bias toward repeat buyers by pool weighting)
      const cust = randChoice(customerPool);
      // decide items count
      const itemCount = Math.random() < 0.25 ? randInt(2,5) : randInt(1,3); // 25% chance of bigger cart
      // pick unique items (or allow repeats)
      const chosen = [];
      for (let j=0;j<itemCount;j++) {
        const prod = randChoice(products);
        const qty = Math.random() < 0.2 ? randInt(2,4) : 1; // 20% chance of qty>1
        chosen.push({ product: prod, quantity: qty });
      }
      // build line_items
      const line_items = chosen.map((ch, idx) => {
        return {
          id: String(900000 + i*10 + idx),
          product_id: ch.product.id,
          sku: ch.product.sku,
          name: ch.product.name,
          quantity: ch.quantity,
          price: Number(ch.product.price),
          total_price: (Number(ch.product.price) * ch.quantity).toFixed(2)
        };
      });
      // compute total price rounded
      const total = line_items.reduce((s,it)=> s + Number(it.total_price), 0).toFixed(2);
      const orderCreatedAt = randomDateWithSeason(90);

      const payload = {
        type: 'order.created',
        data: {
          id: String(600000 + i + Math.floor(Math.random()*90000)),
          customer: {
            id: cust.id,
            email: cust.email,
            first_name: cust.first_name,
            last_name: cust.last_name,
            city: cust.city
          },
          line_items,
          total_price: total,
          created_at: orderCreatedAt
        }
      };

      const res = await sendSigned(payload, tenant, secret);
      if (res.ok) sent++;
      else {
        if (res.err) console.warn('Network error', res.err);
        else console.warn(`Webhook failed: status=${res.status} text=${String(res.text).slice(0,300)}`);
        // small backoff on failure
        await new Promise(r=>setTimeout(r, 300));
      }

      // progress & throttle
      if ((i+1) % 50 === 0) {
        console.log(`  → orders sent: ${i+1}/${O}`);
        await new Promise(r=>setTimeout(r, 400));
      } else if ((i+1) % 10 === 0) {
        await new Promise(r=>setTimeout(r, 120));
      }
    }

    console.log(`Done. Sent ${sent}/${O} order webhooks.`);
    console.log('Open frontend, select tenant, and refresh (choose last 90 days) — charts should show product-level and LTV patterns.');
  } catch (err) {
    console.error('Fatal error', err);
    process.exit(1);
  }
})();
