import React, { useEffect, useState, useCallback } from 'react';
import ViewModeSelector from './ViewModeSelector.jsx';
import CommunicationForm from './CommunicationForm.jsx';
import OperatorsPanel from './OperatorsPanel.jsx';
import SitesPanel from './SitesPanel.jsx';
import History from './History.jsx';
import MonthlyProjection from './MonthlyProjection.jsx';
import { api } from './api.js';
import { IconEdit, IconClock, IconUsers, IconMapPin, IconMonitor, IconSmartphone, IconShield, IconBarChart } from './Icons.jsx';

export default function App() {
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
    loadOperators();
    loadSites();
    loadCommunications();
  }, [loadOperators, loadSites, loadCommunications]);

  function goToForm(protocols) {
    setDuplicateProtocols(protocols || null);
    setFormKey((k) => k + 1);
    setView('form');
  }

  if (!viewMode) {
    return <ViewModeSelector onSelect={selectViewMode} />;
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <IconShield size={20} className="brand-icon" />
          <h1>Servizi Alfa Security</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="icon-btn" onClick={toggleViewMode} title="Cambia visualizzazione">
            {viewMode === 'desktop' ? <IconSmartphone size={18} /> : <IconMonitor size={18} />}
          </button>
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
        {view === 'projection' && <MonthlyProjection />}
      </main>

      <nav className="bottom-nav">
        <button className={view === 'form' ? 'active' : ''} onClick={() => goToForm(null)}>
          <IconEdit size={19} className="icon" />
          Nuova
        </button>
        <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>
          <IconClock size={19} className="icon" />
          Storico
        </button>
        <button className={view === 'operators' ? 'active' : ''} onClick={() => setView('operators')}>
          <IconUsers size={19} className="icon" />
          Operatori
        </button>
        <button className={view === 'sites' ? 'active' : ''} onClick={() => setView('sites')}>
          <IconMapPin size={19} className="icon" />
          Siti
        </button>
        <button className={view === 'projection' ? 'active' : ''} onClick={() => setView('projection')}>
          <IconBarChart size={19} className="icon" />
          Proiezione
        </button>
      </nav>
    </div>
  );
}
