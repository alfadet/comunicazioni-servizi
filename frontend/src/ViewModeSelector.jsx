import React from 'react';

export default function ViewModeSelector({ onSelect }) {
  return (
    <div className="view-mode-screen">
      <h1>Comunicazioni Servizi<br />Alfa Security</h1>
      <p className="view-mode-subtitle">Come vuoi usare l'app?</p>
      <div className="view-mode-options">
        <button className="view-mode-card" onClick={() => onSelect('desktop')}>
          <span className="view-mode-icon">🖥️</span>
          <span className="view-mode-title">Desktop</span>
          <span className="view-mode-desc">MacBook Air o computer</span>
        </button>
        <button className="view-mode-card" onClick={() => onSelect('mobile')}>
          <span className="view-mode-icon">📱</span>
          <span className="view-mode-title">iPhone</span>
          <span className="view-mode-desc">Schermo del telefono</span>
        </button>
      </div>
    </div>
  );
}
