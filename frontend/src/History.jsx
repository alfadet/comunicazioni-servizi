import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import ServiceReport from './ServiceReport.jsx';
import MonthlySummary from './MonthlySummary.jsx';

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function History({ communications, onDuplicate }) {
  const [tab, setTab] = useState('elenco');
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (openId === null) {
      setDetail(null);
      return;
    }
    setLoading(true);
    api.getCommunication(openId).then(setDetail).finally(() => setLoading(false));
  }, [openId]);

  const tabs = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
      <button
        className={tab === 'elenco' ? 'btn btn-primary' : 'btn btn-secondary'}
        onClick={() => setTab('elenco')}
      >
        Elenco
      </button>
      <button
        className={tab === 'riepilogo' ? 'btn btn-primary' : 'btn btn-secondary'}
        onClick={() => setTab('riepilogo')}
      >
        Riepilogo
      </button>
      <button
        className={tab === 'report' ? 'btn btn-primary' : 'btn btn-secondary'}
        onClick={() => setTab('report')}
      >
        Report
      </button>
    </div>
  );

  if (tab === 'riepilogo') {
    return (
      <div>
        {tabs}
        <MonthlySummary />
      </div>
    );
  }

  if (tab === 'report') {
    return (
      <div>
        {tabs}
        <ServiceReport />
      </div>
    );
  }

  if (communications.length === 0) {
    return (
      <div>
        {tabs}
        <div className="empty-state">Nessuna comunicazione inviata finora</div>
      </div>
    );
  }

  if (openId !== null) {
    return (
      <div>
        <button className="btn-ghost" onClick={() => setOpenId(null)} style={{ marginBottom: 10 }}>
          ← Torna allo storico
        </button>
        {loading && <div className="empty-state">Caricamento...</div>}
        {detail && (
          <>
            <div className="card">
              <div className="field">
                <label>Oggetto</label>
                <div>{detail.subject}</div>
              </div>
              <div className="field">
                <label>Inviata il</label>
                <div>{formatDateTime(detail.sent_at)}</div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Corpo</label>
                <pre className="preview-body">{detail.body_text}</pre>
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ marginBottom: 100 }}
              onClick={() => onDuplicate(detail.protocols)}
            >
              Duplica e modifica per un nuovo invio
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {tabs}
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Storico invii</h2>
      {communications.map((c) => (
        <div className="history-item" key={c.id} onClick={() => setOpenId(c.id)}>
          <div className="hi-top">
            <strong style={{ fontSize: 14 }}>{c.protocols.length} protocolli</strong>
            <span className={`status-badge status-${c.send_status}`}>
              {c.send_status === 'sent' ? 'Inviata' : 'Fallita'}
            </span>
          </div>
          <div className="hi-date">{formatDateTime(c.sent_at)}</div>
        </div>
      ))}
    </div>
  );
}
