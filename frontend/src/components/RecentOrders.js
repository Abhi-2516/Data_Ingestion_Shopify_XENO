import React, { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:4000/api';

function fmtDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
}

export default function RecentOrders({ tenant, max = 10 }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(max);
  const [error, setError] = useState('');

  const fetchRecent = async (l = limit) => {
    if (!tenant || !tenant.id) {
      setOrders([]);
      setError('No tenant selected');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url = `${API_BASE}/orders/recent?tenantId=${encodeURIComponent(tenant.id)}&limit=${l}`;
      const res = await fetch(url, {
        headers: {
          // backend supports x-tenant-id header in other places — keep both options consistent
          'x-tenant-id': tenant.id,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`API ${res.status} ${txt}`);
      }
      const data = await res.json();
      // server returns { orders: [...] }
      const arr = data.orders || data || [];
      setOrders(arr);
    } catch (err) {
      console.error('recent orders fetch error', err);
      setError('Failed to load recent orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, limit]);

  return (
    <div className="card table-card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <div>
          <h3 style={{margin:0}}>Recent Orders</h3>
          <div className="muted small">Showing most recent orders (top {limit})</div>
        </div>

        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <select value={limit} onChange={(e)=>setLimit(Number(e.target.value))} style={{padding:'6px 10px', borderRadius:8}}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button className="btn-outline" onClick={()=>fetchRecent(limit)}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div style={{padding:18}}>Loading...</div>
      ) : error ? (
        <div style={{padding:18, color:'#ffb4c6'}}>{error}</div>
      ) : orders.length === 0 ? (
        <div style={{padding:18}} className="muted">No recent orders</div>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table className="table" style={{minWidth:760}}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                // some orders come with nested customer object from include; otherwise use customerId
                const cust = o.customer || o.Customer || null;
                const custLabel = cust?.email ? `${cust.email}` : (cust?.id ? `#${cust.id}` : (o.customerId ? `#${o.customerId}` : '—'));
                // items may not exist on order model; try common fields
                const itemCount = typeof o.itemsCount === 'number' ? o.itemsCount : (o.items ? o.items.length : (o.line_items ? o.line_items.length : '—'));
                return (
                  <tr key={String(o.id) + '-' + String(o.createdAt)}>
                    <td style={{fontWeight:700}}>{o.id}</td>
                    <td>{custLabel}</td>
                    <td>{itemCount}</td>
                    <td>₹ {Number(o.totalPrice || o.total_price || 0).toFixed(2)}</td>
                    <td>{fmtDate(o.createdAtShop || o.createdAt || o.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
