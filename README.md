# XENO Multi‑Tenant Shopify Data Ingestion & Insights Platform

A full‑stack multi‑tenant Shopify customer & order ingestion platform built as part of the **Xeno FDE Internship Assignment – 2025**. This solution demonstrates:

* Multi‑tenant onboarding
* Shopify data ingestion (webhooks + backfill)
* Customer / order / product storage in Postgres
* Email authentication + tenant selector
* Advanced animated dark‑theme analytics dashboard
* Real‑time simulation, CSV export, date‑range filtering
* Clean architecture, extensibility, and production‑grade design

This **README** acts as the **single source of documentation** for submission. It includes:

* Architecture diagram
* Assumptions
* API list
* Data models
* Production considerations
* Setup instructions
* Deployment notes
* Demo flow for reviewers

---

# 🚀 1. High‑Level Architecture

```
┌───────────────────────┐      Webhooks / Backfill
│  Shopify Store(s)     │─────────────────────────────────┐
│  (multi‑tenant)        │                                  │
└───────────────────────┘                                  │
                                                            ▼
                                               ┌────────────────────┐
                                               │  Backend API       │
                                               │  Node.js + Express │
                                               └────────────────────┘
                                                     │      ▲
                                Auth / Metrics / CRUD │      │ JWT
                                                     ▼      │
                                           ┌─────────────────────────┐
                                           │ PostgreSQL (multi‑tenant)│
                                           │ tenants, customers,      │
                                           │ orders, products         │
                                           └─────────────────────────┘
                                                     ▲
                                                     │ Metrics JSON
                                                     ▼
                                         ┌─────────────────────────┐
                                         │ Frontend (React)        │
                                         │ Animated Dark Dashboard │
                                         │ Login + Tenant Select   │
                                         └─────────────────────────┘
```

---

# 🎯 2. Assignment Requirements Checklist

| Requirement                           | Status                                                |
| ------------------------------------- | ----------------------------------------------------- |
| Create Shopify dev store + dummy data | ✅ Done                                                |
| Ingest Customers, Orders, Products    | ✅ Backfill + Webhooks                                 |
| Store in RDBMS                        | ✅ PostgreSQL + Sequelize                              |
| Multi‑tenant data isolation           | ✅ Tenants scoped by UUID                              |
| Webhooks + Backfill workflows         | ✅ Implemented                                         |
| Insights Dashboard                    | ✅ Orders chart, revenue, top customers, recent orders |
| Auth + tenant selector                | ✅ Email/password login                                |
| Documentation                         | ✅ Included here                                       |
| Next‑steps for productionization      | ✅ Included                                            
              

---

# 📌 3. Assumptions

1. OAuth approval for Shopify protected customer data is not feasible for a screening assignment → **Admin API Access Token** used for backfill.
2. Webhooks are the primary real‑time ingestion mechanism.
3. Only *1 active tenant* is expected during demo, but system supports many.
4. Dummy data generator is allowed for analytics demo.
5. Frontend served separately (local or Vercel) and connects to backend via environment variable.

---

# 🗄️ 4. Database Models

### **Tenant**

| Field          | Type                        |
| -------------- | --------------------------- |
| id             | UUID (PK)                   |
| name           | string                      |
| shopify_store  | string                      |
| webhook_secret | string                      |
| shopify_token  | string (Admin Access Token) |

### **Customer**

| Field      | Type                 |
| ---------- | -------------------- |
| id         | integer (Shopify ID) |
| tenantId   | UUID (FK)            |
| email      | string               |
| firstName  | string               |
| lastName   | string               |
| totalSpent | float                |

### **Order**

| Field         | Type                 |
| ------------- | -------------------- |
| id            | integer (Shopify ID) |
| tenantId      | UUID (FK)            |
| customerId    | integer              |
| totalPrice    | float                |
| createdAtShop | datetime             |

### **Product**

| Field    | Type    |
| -------- | ------- |
| id       | integer |
| tenantId | UUID    |
| title    | string  |
| price    | float   |

---

# 🔥 5. API Reference (Complete)

Base URL:

```
http://localhost:4000/api
```

### **Authentication**

#### POST `/api/auth/register`

#### POST `/api/auth/login`

Returns JWT + user info.

---

### **Tenants**

#### GET `/api/tenants`

List all tenants.

#### POST `/api/tenants/create`

Create new tenant.
Body:

```json
{
  "name": "Store Name",
  "shopify_store": "my-store.myshopify.com",
  "webhook_secret": "secret123"
}
```

---

### **Shopify Integration**

#### POST `/api/shopify/backfill`

Pull customers, orders, products using Admin API.

```json
{ "tenantId": "uuid" }
```

#### GET `/api/shopify/install?shop=SHOP_DOMAIN`

Begins OAuth install (optional for demo).

---

### **Webhooks**

#### POST `/api/webhooks/receive?tenantId=UUID`

Shopify calls this when an order/customer event occurs.
HMAC SHA‑256 verification included.

---

### **Metrics / Dashboard**

#### GET `/api/metrics/summary`

Headers: `x-tenant-id: UUID`
Optional query params:

```
?start=YYYY-MM-DD&end=YYYY-MM-DD
```

Response includes:

* totalCustomers
* totalOrders
* revenue
* ordersByDate
* topCustomers
* recentOrders

---

### **Orders**

#### GET `/api/orders/recent?tenantId=UUID&limit=10`

#### GET `/api/orders?tenantId=UUID`

#### GET `/api/orders?tenantId=UUID&start=…&end=…`

---

### **CSV Export**

#### GET `/api/export/orders.csv?tenantId=UUID&start=…&end=…`

Downloads a CSV file.

---

# 🎨 6. Frontend Features

* Secure login
* Tenant selector
* Advanced animated dark‑theme UI
* Line + Bar combined chart
* Customer leaderboard
* Recent orders table
* Date‑range filtering
* CSV export
* Simulate order button (testing webhooks)

---

# 🧪 7. Running Locally

## Backend

```
cd backend
npm install
# create .env (see below)
npm run dev
```

## Frontend

```
cd frontend
npm install
npm start
```

Set environment:

```
REACT_APP_API_URL=http://localhost:4000/api
```

---

# 🔐 8. Required Environment Variables

### Backend `.env`

```
PORT=4000
DATABASE_URL=postgres://postgres:password@localhost:5432/xeno_db
JWT_SECRET=supersecret
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_SCOPES=read_products,read_customers,read_orders
APP_URL=http://localhost:4000
```

### Frontend `.env`

```
REACT_APP_API_URL=http://localhost:4000/api
```

---

# 📦 9. Deployment Instructions

### Recommended Architecture

* **Frontend** → Vercel
* **Backend** → Render / Railway / Fly.io
* **Postgres** → Render PostgreSQL / Railway PostgreSQL

### Steps

1. Push full project to GitHub
2. Deploy backend (Render Web Service)
3. Add env vars in Render dashboard
4. Deploy frontend to Vercel
5. Set `REACT_APP_API_URL` to deployed backend
6. Update Shopify App URLs (callback + redirect)
7. Test login, tenant select, backfill, dashboard

---

# 🧱 10. Next Steps to Productionize

* Replace Admin Token with full OAuth app flow
* Add background workers for periodic Shopify syncing
* Add Redis caching layer for metrics
* Add Sentry / logging
* Add automated tests (unit + integration)
* Add rate limiting and abuse protection
* Add CI/CD workflow

---

# 🎥 11. Demo Guide (For Reviewers)

### Show in this order:

1. Login → Tenant Selector
2. Dashboard summary + charts
3. Date range filtering
4. CSV export
5. Simulate order → metrics auto‑update
6. Show multi‑tenant isolation (if 2nd tenant exists)
7. Show code structure (backend / models / controllers)
8. Show Postgres tables + ingested data

This order demonstrates ingestion → storage → analytics end‑to‑end.

---

# 📁 12. Project Structure

```
root/
│ README.md   ← (this file)
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── config/db.js
│   │   └── server.js
│   └── scripts/
│       └── generateDummyData.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   ├── styles.css
│   │   └── App.js
│   └── public/
```

---

