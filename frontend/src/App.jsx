import React, { useEffect, useState, useCallback } from 'react';
import Login from './Login.jsx';
import CommunicationForm from './CommunicationForm.jsx';
import OperatorsPanel from './OperatorsPanel.jsx';
import History from './History.jsx';
import { api } from './api.js';

export default function App() {
  const [username, setUsername] = useState(null);
  const [view, setView] = useState('form');
  const [operators, setOperators] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [duplicateProtocols, setDuplicateProtocols] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const loadOperators = useCallback(() => {
    api.getOperators().then(setOperators).catch(() => {});
  }, []);

  const loadCommunications = useCallback(() => {
    api.getCommunications().then(setCommunications).catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setUsername(localStorage.getItem('username') || 'operatore');
  }, []);

  useEffect(() => {
    if (!username) return;
    loadOperators();
    loadCommunications();
  }, [username, loadOperators, loadCommunications]);

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

  if (!username) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <div className="topbar">
        <h1>Servizi Alfa Security</h1>
        <button className="logout-btn" onClick={logout}>Esci</button>
      </div>

      <main>
        {view === 'form' && (
          <CommunicationForm
            key={formKey}
            operators={operators}
            initialProtocols={duplicateProtocols}
            onSent={() => {
              loadCommunications();
              setDuplicateProtocols(null);
            }}
          />
        )}
        {view === 'operators' && <OperatorsPanel operators={operators} reload={loadOperators} />}
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
      </nav>
    </div>
  );
}
