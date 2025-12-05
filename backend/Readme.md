# Backend README — XENO Multi-Tenant Shopify Ingestion Service

This backend powers the **Xeno Multi-Tenant Shopify Data Ingestion Platform**, implementing:

* Multi-tenant onboarding
* Shopify ingestion (Backfill + Webhooks)
* Data persistence in PostgreSQL
* Metrics aggregation for dashboard
* Authentication (JWT)
* CSV export
* Dummy data generation for demo

This README contains everything needed to understand, run, and extend the backend.

---

# ⚙️ 1. Tech Stack

* **Node.js (Express)** — REST API
* **PostgreSQL** — Relational database
* **Sequelize ORM** — Models + migrations
* **JWT Auth** — Login protection
* **Shopify REST Admin API** — Backfill ingestion
* **HMAC-verified Webhooks** — Real-time order/customer updates

---

# 📁 2. Project Structure

```
backend/
│  README.md
│  .env
│  package.json
│  server.js
│
├── src/
│   ├── config/db.js              → Sequelize connection
│   ├── models/                   → Tenant, Customer, Order, Product
│   ├── controllers/              → Auth, Shopify, Metrics, Webhook
│   ├── routes/                   → API routing layer
│   └── utils/                    → Helpers (HMAC validation, etc.)
│
└── scripts/
    └── generateDummyData.js      → Generates demo customers + orders
```

---

# 🔐 3. Environment Variables (`.env`)

Create a `.env` file inside `/backend`:

```
PORT=4000
DATABASE_URL=postgres://postgres:password@localhost:5432/xeno_db
JWT_SECRET=supersecret

# Shopify App Credentials
SHOPIFY_API_KEY=xxxx
SHOPIFY_API_SECRET=xxxx
SHOPIFY_SCOPES=read_products,read_customers,read_orders
APP_URL=http://localhost:4000
```

### Tenant-specific secrets (Admin Token + Webhook Secret)

Stored *per tenant* in DB:

* `shopify_token` (Admin API token or OAuth token)
* `webhook_secret` (for webhook HMAC validation)

---

# ▶️ 4. Running the Backend

### Install dependencies

```
cd backend
npm install
```

### Start Dev Server

```
npm run dev
```

API runs on:

```
http://localhost:4000/api
```

---

# 🗄️ 5. Database Models

## Tenant

```
- id (UUID PK)
- name
- shopify_store
- webhook_secret
- shopify_token
```

## Customer

```
- id (Shopify numeric ID)
- tenantId (FK)
- email
- firstName
- lastName
- totalSpent
```

## Order

```
- id (Shopify numeric ID)
- tenantId (FK)
- customerId
- totalPrice
- createdAtShop
```

## Product

```
- id
- tenantId
- title
- price
```

---

# 🌐 6. API Reference (Backend)

Base URL:

```
http://localhost:4000/api
```

### 🔑 Auth

#### POST `/auth/register`

#### POST `/auth/login`

Returns JWT.

---

### 🏬 Tenants

#### GET `/tenants`

List tenants.

#### POST `/tenants/create`

Create a new tenant.

```json
{
  "name": "Xeno Test Store",
  "shopify_store": "my-store.myshopify.com",
  "webhook_secret": "secret123"
}
```

---

### 🛒 Shopify

#### POST `/shopify/backfill`

Pulls products, customers, orders using Admin API.

```json
{ "tenantId": "uuid" }
```

#### GET `/shopify/install?shop=store.myshopify.com`

Starts OAuth install flow (optional for demo).

---

### 📬 Webhooks

#### POST `/webhooks/receive?tenantId=UUID`

* Validates **HMAC SHA-256** signature
* Ingests orders/customers in real-time

---

### 📊 Metrics

#### GET `/metrics/summary`

Headers:

```
x-tenant-id: UUID
```

Query params:

```
?start=YYYY-MM-DD&end=YYYY-MM-DD
```

Returns:

```
{
  totalCustomers,
  totalOrders,
  revenue,
  ordersByDate: [...],
  topCustomers: [...],
  recentOrders: [...]
}
```

---

### 📦 Orders

#### GET `/orders/recent?tenantId=UUID&limit=10`

#### GET `/orders?tenantId=UUID`

#### GET `/orders?tenantId=UUID&start=...&end=...`

---

### 📄 CSV Export

#### GET `/export/orders.csv?tenantId=UUID&start=...&end=...`

Downloads CSV of orders.

---

# 🧪 7. Dummy Data Generator

Generate demo customers + orders:

```
node scripts/generateDummyData.js TENANT_ID 100 300
```

Meaning:

```
100 customers
300 orders
```

Useful for dashboard demos.

---

# 🔧 8. Production Notes

### Required improvements for real-world use:

* Implement full Shopify OAuth instead of Admin Token
* Add scheduled sync workers (hourly backfill)
* Add caching (Redis) for metrics
* Add rate limiting + input validation
* Add logging (Winston/Sentry)
* Deploy via Docker or Render

---

# 🧹 9. Common Commands

| Action              | Command                                 |
| ------------------- | --------------------------------------- |
| Start dev server    | `npm run dev`                           |
| Start prod server   | `node src/server.js`                    |
| Run linter          | *optional*                              |
| Generate dummy data | `node scripts/generateDummyData.js ...` |

---

