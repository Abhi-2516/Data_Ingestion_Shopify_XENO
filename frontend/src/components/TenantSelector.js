// frontend/src/components/TenantSelector.js
import React, { useEffect, useState } from 'react';
import { listTenants } from '../api';
import { storeTenant } from '../utils/storage';

export default function TenantSelector({ onSelect, onLogout, user }) {
  const [tenants, setTenants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  // friendly email fallback: prop -> localStorage -> blank
  const userEmail = (user && user.email) || localStorage.getItem('userEmail') || '';

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listTenants()
      .then(res => {
        // handle different API shapes
        const list = (res && (res.data?.tenants || res.data || res.tenants || res)) || [];
        if (mounted) {
          setTenants(list);
          setFiltered(list);
        }
      })
      .catch(err => {
        console.error('Could not fetch tenants', err);
        if (mounted) setError('Could not fetch tenants. Is your backend running?');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    if (!q) return setFiltered(tenants);
    const low = q.toLowerCase();
    setFiltered(tenants.filter(t => (t.name || '').toLowerCase().includes(low) || (t.shopify_store || '').toLowerCase().includes(low)));
  }, [q, tenants]);

  const select = (t) => {
    try { storeTenant(t); } catch (e) { /* ignore */ }
    onSelect && onSelect(t);
  };

  return (
    <div className="page" style={{ padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ margin: '0 0 6px 0', fontSize: 34 }}>Choose tenant</h1>
          <div className="muted small">
            Hello {userEmail ? <strong style={{ color: '#fff' }}>{userEmail}</strong> : <span>— please sign in</span>}.
            <span style={{ marginLeft: 8 }}> Pick a tenant to view its store metrics.</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
          <input
            className="input"
            style={{ flex: 1, maxWidth: 520 }}
            placeholder="Search tenants or store (type to filter)..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn-ghost" onClick={() => { setQ(''); setFiltered(tenants); }}>Clear</button>
          <button className="btn" onClick={() => { /* quick demo: simulate change of tenant list */ setLoading(true); listTenants().finally(()=>setLoading(false)); }}>
            Refresh
          </button>
        </div>

        <div className="card" style={{ padding: 18 }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>Loading tenants…</div>
          ) : error ? (
            <div style={{ padding: 18, color: '#ffb4b4' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24 }} className="muted">No tenants found. Create one using the backend API.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {filtered.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.03)'
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                      minWidth: 56,
                      minHeight: 56,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: 'white',
                      background: 'linear-gradient(135deg,#7c3aed,#06b6d4)'
                    }}>
                      { (t.name || '?').slice(0,2).toUpperCase() }
                    </div>

                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{t.name}</div>
                      <div className="muted small">{t.shopify_store || '—'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      className="btn"
                      onClick={() => select(t)}
                      title={`Select ${t.name}`}
                      style={{ minWidth: 110 }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-start' }}>
          <button
            className="btn-outline"
            onClick={() => {
              // "change tenant" action: clear current selection and trigger parent handler
              onSelect && onSelect(null);
            }}
          >
            Change tenant
          </button>

          <button
            className="btn"
            onClick={() => {
              // clear login and call parent logout
              try {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userEmail');
              } catch (e) { /* ignore */ }
              onLogout && onLogout();
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
