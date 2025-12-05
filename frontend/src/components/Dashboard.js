// frontend/src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import { sendWebhook } from '../api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import '../styles.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const COLORS = {
  purple: '#9b6bff',
  teal: '#2edbd2',
  bgCard: 'rgba(255,255,255,0.03)',
  accent: '#c084f5',
  bar: '#3dc1ff',
};

function numberWithCommas(x) {
  if (x === null || x === undefined || Number.isNaN(x)) return '0';
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function Dashboard({ tenant }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // recent orders state (fetch separately so table is reliable)
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState('');

  const API_BASE = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:4000/api').replace(/\/$/, '');
  const PUBLIC_BASE = API_BASE.replace(/\/api$/, '');

  useEffect(() => {
    if (!tenant) return;
    fetchMetrics();
    fetchRecentOrders(10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, refreshKey]);

  const fetchMetrics = async (s = start, e = end) => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      if (s) qs.set('start', s);
      if (e) qs.set('end', e);
      const urlSuffix = qs.toString() ? `?${qs.toString()}` : '';
      const res = await fetch(`${API_BASE}/metrics/summary${urlSuffix}`, {
        headers: { 'x-tenant-id': tenant.id },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`failed to fetch: ${res.status} ${t}`);
      }
      const data = await res.json();
      setMetrics(data);

      // If metrics included recentOrders, populate local copy
      if (data?.recentOrders && Array.isArray(data.recentOrders)) {
        setRecentOrders(data.recentOrders.slice(0, 20));
      }
    } catch (err) {
      console.error('fetchMetrics error', err);
      setError('Failed to fetch metrics. Check backend and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async (limit = 10) => {
    if (!tenant || !tenant.id) {
      setRecentOrders([]);
      setRecentError('No tenant selected');
      return;
    }
    setRecentLoading(true);
    setRecentError('');
    try {
      const url = `${API_BASE}/orders/recent?tenantId=${encodeURIComponent(tenant.id)}&limit=${limit}`;
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenant.id,
        },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Failed to fetch recent orders: ${res.status} ${t}`);
      }
      const body = await res.json();
      const arr = body.orders || body || [];
      setRecentOrders(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error('fetchRecentOrders error', err);
      setRecentError('Failed to load recent orders');
      setRecentOrders([]);
    } finally {
      setRecentLoading(false);
    }
  };

  const applyRange = () => {
    if (start && end && new Date(start) > new Date(end)) {
      alert('Start date must be before end date');
      return;
    }
    setRefreshKey((k) => k + 1);
    fetchMetrics(start, end);
    fetchRecentOrders(10);
  };

  const resetRange = () => {
    setStart('');
    setEnd('');
    setRefreshKey((k) => k + 1);
    fetchMetrics('', '');
    fetchRecentOrders(10);
  };

  const simulateOrder = async () => {
    const payload = {
      type: 'order.created',
      data: {
        id: Math.floor(Math.random() * 1000000).toString(),
        customer: { id: Math.floor(Math.random() * 100000).toString() },
        total_price: (Math.random() * 200).toFixed(2),
        created_at: new Date().toISOString(),
      },
    };
    try {
      await sendWebhook(tenant.id, payload);
      await fetchMetrics();
      await fetchRecentOrders(10);
      alert('Simulated order created — dashboard refreshed.');
    } catch (e) {
      alert('Failed to simulate webhook. See console.');
      console.error(e);
    }
  };

  const exportCsv = () => {
    const qs = new URLSearchParams();
    if (start) qs.set('start', start);
    if (end) qs.set('end', end);
    const url = `${PUBLIC_BASE}/api/export/orders.csv?tenantId=${tenant.id}${qs.toString() ? '&' + qs.toString() : ''}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="card">Loading metrics...</div>;
  if (error) return <div className="card error">{error}</div>;
  if (!metrics) return <div className="card">No data</div>;

  // --- Orders by date (line) and revenue (bar)
  const ordersByDate = metrics.ordersByDate || [];
  const labels = ordersByDate.map((r) => r.date);
  const counts = ordersByDate.map((r) => Number(r.count ?? 0));
  const revenues = ordersByDate.map((r) => Number(r.revenue ?? 0));

  const combinedData = {
    labels,
    datasets: [
      {
        type: 'line',
        label: 'Orders',
        data: counts,
        borderColor: COLORS.purple,
        backgroundColor: COLORS.purple,
        tension: 0.25,
        pointRadius: 3,
        yAxisID: 'y-orders',
      },
      {
        type: 'bar',
        label: 'Revenue',
        data: revenues,
        backgroundColor: COLORS.teal,
        borderRadius: 6,
        yAxisID: 'y-rev',
      },
    ],
  };

  const combinedOptions = {
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { color: '#e6eef8' } },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw;
            if (ctx.dataset.type === 'bar') return `Revenue: ₹ ${numberWithCommas(Number(val || 0).toFixed(2))}`;
            return `Orders: ${numberWithCommas(Number(val || 0))}`;
          },
        },
      },
    },
    scales: {
      x: { ticks: { color: '#cbd5e1' } },
      'y-orders': {
        type: 'linear',
        position: 'left',
        ticks: { color: '#cbd5e1' },
        title: { display: true, text: 'Orders', color: '#cbd5e1' },
      },
      'y-rev': {
        type: 'linear',
        position: 'right',
        ticks: { color: '#cbd5e1', callback: (v) => numberWithCommas(Math.round(v)) },
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Revenue', color: '#cbd5e1' },
      },
    },
  };

  // --- Top customers (horizontal bar) - server-provided expected shape
  const topCustomers = metrics.topCustomers || [];
  const custLabels = (topCustomers.length ? topCustomers : []).map((c) => c.email || c.id || `cust-${c.id || 'x'}`);
  const custValues = (topCustomers.length ? topCustomers : []).map((c) => Number(c.totalSpent ?? c.total ?? c.value ?? 0));
  const custData = {
    labels: custLabels,
    datasets: [{ label: 'Total Spent', data: custValues, backgroundColor: COLORS.accent }],
  };
  const custOptions = {
    indexAxis: 'y',
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { color: '#cbd5e1' } }, y: { ticks: { color: '#cbd5e1' } } },
  };

  // recent orders fallback: prefer metrics.recentOrders (if present) else use fetched recentOrders
  const recent = Array.isArray(metrics.recentOrders) && metrics.recentOrders.length > 0 ? metrics.recentOrders.slice(0, 20) : recentOrders;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="muted small">Tenant: <strong>{tenant.name}</strong></div>
        </div>

        <div className="controls">
          <div className="range-controls">
            <label className="muted small">Start</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            <label className="muted small">End</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            <button className="btn" onClick={applyRange}>Apply</button>
            <button className="btn-outline" onClick={resetRange}>Reset</button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={exportCsv}>Export CSV</button>
            <button className="btn" onClick={simulateOrder}>Simulate Order</button>
          </div>
        </div>
      </div>

      <div className="summary-cards">
        <div className="card summary">
          <div className="label">Customers</div>
          <div className="value">{metrics.totalCustomers ?? 0}</div>
        </div>
        <div className="card summary">
          <div className="label">Orders</div>
          <div className="value">{metrics.totalOrders ?? 0}</div>
        </div>
        <div className="card summary">
          <div className="label">Revenue</div>
          <div className="value">₹ {Number(metrics.revenue ?? 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card chart-large">
          <h3>Orders & Revenue — by date</h3>
          <div style={{ height: 360 }}>
            <Line data={combinedData} options={combinedOptions} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card chart-small" style={{ height: 240 }}>
            <h4>Top Customers</h4>
            {custValues.length > 0 ? (
              <div style={{ height: 180 }}>
                <Bar data={custData} options={custOptions} />
              </div>
            ) : (
              <div className="muted small">No customer data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="card table card-muted">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <h3 style={{ margin: 0 }}>Recent Orders</h3>
            <div className="muted small">Showing most recent orders (top 10)</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-outline" onClick={() => fetchRecentOrders(10)}>Refresh</button>
            <button className="btn-ghost" onClick={() => fetchRecentOrders(20)}>Show 20</button>
          </div>
        </div>

        {recentLoading ? (
          <div style={{ padding: 16 }}>Loading recent orders...</div>
        ) : recentError ? (
          <div style={{ padding: 16, color: '#ffb4c6' }}>{recentError}</div>
        ) : recent.length === 0 ? (
          <div style={{ padding: 16 }} className="muted small">No recent orders</div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table className="table">
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
                {recent.slice(0, 10).map((o) => {
                  const customerObj = o.customer || o.Customer || (o.customerId ? { id: o.customerId } : null);
                  const custLabel = customerObj?.email ? customerObj.email : (customerObj?.id ? `#${customerObj.id}` : '—');

                  const itemsCount =
                    typeof o.itemsCount === 'number' ? o.itemsCount :
                    Array.isArray(o.line_items) ? o.line_items.length :
                    Array.isArray(o.items) ? o.items.length :
                    (o.itemCount || '—');

                  const total = Number(o.totalPrice ?? o.total ?? o.total_price ?? 0).toFixed(2);
                  const date = (o.createdAtShop || o.createdAt || o.created_at);
                  const dateStr = date ? new Date(date).toLocaleString() : '—';

                  return (
                    <tr key={`${o.id}-${date || ''}`}>
                      <td style={{ fontWeight: 700 }}>{o.id}</td>
                      <td>{custLabel}</td>
                      <td>{itemsCount}</td>
                      <td>₹ {total}</td>
                      <td>{dateStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
