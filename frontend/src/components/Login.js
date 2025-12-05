import React, { useState } from 'react';

export default function LoginHero({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const doLogin = (e) => {
    e.preventDefault();
    // in your app logic call onLogin(email, pw)
    onLogin && onLogin(email || 'demo@example.com', pw || 'demo');
  };

  return (
    <div className="hero">
      <div className="hero-grid">
        <div className="hero-card">
          <div className="h-title">Sign in to XENO Insights</div>
          <div className="h-lead">Visualize store performance, customers and revenue. Demo-ready UI.</div>

          <form onSubmit={doLogin}>
            <div className="login-row">
              <label>Email</label>
              <input className="input" type="text" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" />
            </div>

            <div className="login-row">
              <label>Password</label>
              <input className="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="password (demo)" />
            </div>

            <div className="auth-buttons">
              <button type="submit" className="btn">Login</button>
              <button type="button" className="btn-outline" onClick={()=>{ setEmail(''); setPw(''); }}>Clear</button>
            </div>

            <div className="auth-note">This demo stores a JWT in localStorage for API calls.</div>
          </form>
        </div>

        <div className="hero-visual">
          <div className="visual-inner">
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:20,fontWeight:800,marginBottom:8}}>Welcome to XENO</div>
              <div className="muted small">A modern multi-tenant Shopify analytics demo</div>
            </div>

            <div className="bubbles">
              <div className="bubble"><div style={{fontSize:20}}>58</div><div className="small muted">Orders</div></div>
              <div className="bubble small"><div style={{fontSize:16}}>13</div><div className="small muted">Customers</div></div>
              <div className="bubble"><div style={{fontSize:20}}>₹6805</div><div className="small muted">Revenue</div></div>
            </div>
          </div>
        </div>
      </div> {/* hero-grid */}
    </div>
  );
}
