import React from 'react';
import { IconShield, IconMonitor, IconSmartphone } from './Icons.jsx';

export default function ViewModeSelector({ onSelect }) {
  return (
    <div className="view-mode-screen">
      <IconShield size={34} className="view-mode-logo" />
      <h1>Comunicazioni Servizi<br />Alfa Security</h1>
      <p className="view-mode-subtitle">Come vuoi usare l'app?</p>
      <div className="view-mode-options">
        <button className="view-mode-card" onClick={() => onSelect('desktop')}>
          <IconMonitor size={34} className="view-mode-icon" />
          <span className="view-mode-title">Desktop</span>
          <span className="view-mode-desc">MacBook Air o computer</span>
        </button>
        <button className="view-mode-card" onClick={() => onSelect('mobile')}>
          <IconSmartphone size={34} className="view-mode-icon" />
          <span className="view-mode-title">iPhone</span>
          <span className="view-mode-desc">Schermo del telefono</span>
        </button>
      </div>
    </div>
  );
}
