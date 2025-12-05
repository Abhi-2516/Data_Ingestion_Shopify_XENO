import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:4000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

// automatically attach JWT if present
client.interceptors.request.use(cfg => {
  try {
    const token = localStorage.getItem('xeno_token');
    if (token) {
      cfg.headers = cfg.headers || {};
      cfg.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {}
  return cfg;
});

export function metricsSummary(tenantId) {
  return client.get('/metrics/summary', {
    headers: { 'x-tenant-id': tenantId }
  });
}

export function listTenants() {
  return client.get('/tenants');
}

export function sendWebhook(tenantId, payload) {
  // simulate allowed by setting x-allow-sim header
  return client.post('/webhooks/receive', payload, {
    headers: { 'x-tenant-id': tenantId, 'x-allow-sim': 'true' }
  });
}

export function authRegister(body) {
  return client.post('/auth/register', body);
}

export function authLogin(body) {
  return client.post('/auth/login', body);
}

export default client;
