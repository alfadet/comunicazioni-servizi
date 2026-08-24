import React, { useEffect, useState, useCallback } from 'react';
import Login from './Login.jsx';
import ViewModeSelector from './ViewModeSelector.jsx';
import CommunicationForm from './CommunicationForm.jsx';
import OperatorsPanel from './OperatorsPanel.jsx';
import SitesPanel from './SitesPanel.jsx';
import History from './History.jsx';
import { api } from './api.js';

export default function App() {
  const [username, setUsername] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode'));
  const [view, setView] = useState('form');
  const [operators, setOperators] = useState([]);
  const [sites, setSites] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [duplicateProtocols, setDuplicateProtocols] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const loadOperators = useCallback(() => {
    api.getOperators().then(setOperators).catch(() => {});
  }, []);

  const loadSites = useCallback(() => {
    api.getSites().then(setSites).catch(() => {});
  }, []);

  const loadCommunications = useCallback(() => {
    api.getCommunications().then(setCommunications).catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setUsername(localStorage.getItem('username') || 'operatore');
  }, []);

  useEffect(() => {
    if (viewMode) document.documentElement.setAttribute('data-view', viewMode);
  }, [viewMode]);

  function selectViewMode(mode) {
    localStorage.setItem('viewMode', mode);
    setViewMode(mode);
  }

  function toggleViewMode() {
    selectViewMode(viewMode === 'desktop' ? 'mobile' : 'desktop');
  }

  useEffect(() => {
    if (!username) return;
    loadOperators();
    loadSites();
    loadCommunications();
  }, [username, loadOperators, loadSites, loadCommunications]);

  function handleLogin(name) {
    localStorage.setItem('username', name);
    setUsername(name);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUsername(null);
  }

  function goToForm(protocols) {
    setDuplicateProtocols(protocols || null);
    setFormKey((k) => k + 1);
    setView('form');
  }

  if (!viewMode) {
    return <ViewModeSelector onSelect={selectViewMode} />;
  }

  if (!username) {
    return <Login onLogin={handleLogin} onChangeViewMode={() => setViewMode(null)} />;
  }

  return (
    <div className="app">
      <div className="topbar">
        <h1>Servizi Alfa Security</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="logout-btn" onClick={toggleViewMode} title="Cambia visualizzazione">
            {viewMode === 'desktop' ? '📱' : '🖥️'}
          </button>
          <button className="logout-btn" onClick={logout}>Esci</button>
        </div>
      </div>

      <main>
        {view === 'form' && (
          <CommunicationForm
            key={formKey}
            operators={operators}
            sites={sites}
            initialProtocols={duplicateProtocols}
            onSent={() => {
              loadCommunications();
              setDuplicateProtocols(null);
            }}
          />
        )}
        {view === 'operators' && <OperatorsPanel operators={operators} reload={loadOperators} />}
        {view === 'sites' && <SitesPanel sites={sites} reload={loadSites} />}
        {view === 'history' && (
          <History
            communications={communications}
            onDuplicate={(protocols) => goToForm(protocols)}
          />
        )}
      </main>

      <nav className="bottom-nav">
        <button className={view === 'form' ? 'active' : ''} onClick={() => goToForm(null)}>
          <span className="icon">📝</span>
          Nuova
        </button>
        <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>
          <span className="icon">🕓</span>
          Storico
        </button>
        <button className={view === 'operators' ? 'active' : ''} onClick={() => setView('operators')}>
          <span className="icon">👥</span>
          Operatori
        </button>
        <button className={view === 'sites' ? 'active' : ''} onClick={() => setView('sites')}>
          <span className="icon">📍</span>
          Siti
        </button>
      </nav>
    </div>
  );
}
