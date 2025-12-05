import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import TenantSelector from './components/TenantSelector';
import Dashboard from './components/Dashboard';
import { getStoredTenant, getStoredUser, clearStorage } from './utils/storage';

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [tenant, setTenant] = useState(() => getStoredTenant());

  useEffect(() => {
    // if backend URL unreachable, we will show helpful message inside components
  }, []);

  const handleLogout = () => {
    clearStorage();
    setUser(null);
    setTenant(null);
  };

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  if (!tenant) {
    return <TenantSelector onSelect={(t) => setTenant(t)} onLogout={handleLogout} user={user} />;
  }

  return (
    <div className="app-root">
      <header className="navbar">
        <div className="navbar-left">
          <div className="navbar-logo">XENO</div>

          <div className="navbar-title">Tenant Dashboard</div>
        </div>

        <div className="navbar-center">
          <div className="navbar-meta">
            <span className="meta-label">User</span>
            <span className="meta-value">{user.email}</span>
          </div>

          <div className="navbar-meta">
            <span className="meta-label">Tenant</span>
            <span className="meta-value">{tenant.name}</span>
          </div>
        </div>

        <div className="navbar-right">
          <button className="btn-ghost small" onClick={() => setTenant(null)}>
            Change Tenant
          </button>

          <button className="btn small" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>


      <main className="app-main">
        <Dashboard tenant={tenant} />
      </main>

      <footer className="app-footer">
        Built by Abhishek yadav for XENO
      </footer>
    </div>
  );
}
