# Frontend README — XENO Multi-Tenant Shopify Insights Dashboard

This frontend application provides a **modern animated dashboard** for the *Xeno Shopify Data Ingestion Platform*. It communicates with the backend API to display real-time analytics, charts, customer insights, recent orders, and supports secure authentication + tenant selection.

This README explains setup, environment variables, project structure, and deployment steps.

---

# 🎨 1. Tech Stack

* **React (CRA / Vite-compatible structure)**
* **Chart.js + react-chartjs-2** — Line/Bar/Pie charts
* **Custom advanced dark UI theme**
* **JWT-based authentication**
* **REST API integration with backend**

---

# 📁 2. Project Structure

```
frontend/
│  README.md
│  package.json
│  .env
│  src/
│     App.js
│     api.js
│     index.js
│     styles.css
│
│     components/
│        Login.js
│        TenantSelector.js
│        Dashboard.js
│
│     utils/
│        storage.js
│        auth.js
│
└── public/
```

---

# ⚙️ 3. Environment Setup

### Install dependencies

```
cd frontend
npm install
```

### Start development server

```
npm start
```

The app runs at:

```
http://localhost:3000
```

---

# 🔐 4. Environment Variables (`.env`)

Create `/frontend/.env`:

```
REACT_APP_API_URL=http://localhost:4000/api
```

For production (example):

```
REACT_APP_API_URL=https://your-backend-url.com/api
```

React automatically injects variables prefixed with `REACT_APP_`.

---

# 🧠 5. Application Flow

### 1. **Login**

User enters email + password → JWT token stored locally.

### 2. **Tenant Selection**

User chooses which Shopify tenant/store to view.

* List populated via `/api/tenants`
* Selected tenant stored in localStorage

### 3. **Dashboard**

Displays:

* Total Customers
* Total Orders
* Total Revenue
* Orders & Revenue chart
* Top customers
* Recent orders table
* Date range filtering
* CSV Export
* Simulate order (test webhooks)

Data loaded via:

* `/api/metrics/summary`
* `/api/orders/recent`
* `/api/export/orders.csv`

All requests include tenant context using:

```
x-tenant-id: TENANT_UUID
```

---

# 📊 6. Key Components

### **Login.js**

* Handles authentication
* Calls `/auth/login`
* Stores JWT token

### **TenantSelector.js**

* Lists tenants
* Calls `/tenants`
* Stores chosen tenant

### **Dashboard.js**

A full analytics screen including:

* Summary metrics cards
* Line + Bar combined chart
* Top customers leaderboard
* Recent orders table
* Range filters
* CSV export
* Animate/hover UI

---

# 🎨 7. UI & Styling

Located in: `src/styles.css`
Includes:

* Animated dark UI theme
* Neon gradients
* Hover animations
* Responsive layout
* Dashboard grid system

This theme was built custom to create an **eye-catching, modern, recruiter-attracting UI**, suitable for the internship submission.

---

# 🔌 8. API Integration

All API requests are routed through `api.js`:

```
export async function login(email, password) {...}
export async function listTenants() {...}
export async function metricsSummary() {...}
export async function sendWebhook() {...}
```

JWT + tenant ID are added automatically.

---

# 🧪 9. Local Development Testing

### 1️⃣ Start backend

```
cd backend
npm run dev
```

### 2️⃣ Start frontend

```
cd frontend
npm start
```

### 3️⃣ Login and select a tenant

### 4️⃣ Backfill data

```
POST /api/shopify/backfill
```

### 5️⃣ Visit dashboard → charts populate

### Optional Demo Data

Use script:

```
node backend/scripts/generateDummyData.js TENANT_ID 100 300
```

Dashboard refreshes automatically.

---

# 🚀 10. Deployment Guide

### Deploy on **Vercel** (recommended)

1. Push project → GitHub
2. In Vercel:

   * Create new project → Select `frontend/`
   * Set environment variable:

     ```
     REACT_APP_API_URL=https://your-backend-host.com/api
     ```
3. Deploy
4. Test login + dashboard

### Backend must already be deployed (Render / Railway / AWS)

---

# 🧹 11. Build for production

```
npm run build
```

Generates optimized static bundle in `build/`.

You can host this in:

* Vercel
* Netlify
* S3 + CloudFront
* Any static hosting platform

---

