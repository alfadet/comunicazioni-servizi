import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import { IconChevronLeft, IconChevronRight } from './Icons.jsx';

function nowYearMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function isCurrentMonth(year, month) {
  const now = nowYearMonth();
  return year === now.year && month === now.month;
}

export default function MonthlySummary() {
  const [{ year, month }, setYearMonth] = useState(nowYearMonth());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .getMonthSummary(year, month)
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [year, month]);

  function shift(delta) {
    setYearMonth((prev) => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m > 12) { m = 1; y += 1; }
      if (m < 1) { m = 12; y -= 1; }
      return { year: y, month: m };
    });
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Mese precedente">
            <IconChevronLeft size={20} />
          </button>
          <strong style={{ fontSize: 15, letterSpacing: '0.01em' }}>{summary?.monthLabel || '...'}</strong>
          <button
            className="icon-btn"
            onClick={() => shift(1)}
            disabled={isCurrentMonth(year, month)}
            aria-label="Mese successivo"
          >
            <IconChevronRight size={20} />
          </button>
        </div>

        {loading && <div className="empty-state">Caricamento...</div>}
        {error && <div className="error-banner">{error}</div>}

        {summary && !loading && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)' }}>{summary.total}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 12 }}>
                {isCurrentMonth(year, month) ? 'servizi fatti finora questo mese' : 'servizi totali nel mese'}
              </div>
              <button className="btn btn-secondary" onClick={() => api.downloadMonthSummaryPdf(year, month)}>
                Scarica PDF
              </button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text-dim)' }}>
                PER SITO / LOCALE / EVENTO
              </div>
              {summary.perSito.length === 0 && <div className="empty-state">Nessun servizio</div>}
              {summary.perSito.map(([nome, n]) => (
                <div key={nome} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{nome}</span>
                  <strong>{n}</strong>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--text-dim)' }}>
                PER OPERATORE
              </div>
              {summary.perOperatore.length === 0 && <div className="empty-state">Nessun servizio</div>}
              {summary.perOperatore.map(([nome, n]) => (
                <div key={nome} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{nome}</span>
                  <strong>{n}</strong>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
