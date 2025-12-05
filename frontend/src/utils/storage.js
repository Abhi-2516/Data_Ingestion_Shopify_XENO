const USER_KEY = 'xeno_user';
const TENANT_KEY = 'xeno_tenant';
const TOKEN_KEY = 'xeno_token';

export function storeUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function getStoredUser() {
  try { const s = localStorage.getItem(USER_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
export function storeTenant(t) {
  localStorage.setItem(TENANT_KEY, JSON.stringify(t));
}
export function getStoredTenant() {
  try { const s = localStorage.getItem(TENANT_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
export function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearStorage() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TENANT_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
