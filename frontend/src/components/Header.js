// Header.js - bold header with tenant/actions
import React from 'react';

export default function Header({ userEmail, onLogout, onChangeTenant }) {
  return (
    <div style={{width:'100%', maxWidth:1200, margin:'24px auto 12px', padding:'0 24px'}} className="header-row">
      <div className="header-left">
        <h1>XENO — Tenant Dashboard</h1>
        <div className="muted small">User: <strong style={{color:'#fff'}}>{userEmail}</strong></div>
      </div>

      <div className="header-right">
        <button className="btn-ghost" onClick={onChangeTenant}>Change Tenant</button>
        <button className="btn" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
