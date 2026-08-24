import React, { useMemo, useState } from 'react';
import { api } from './api.js';

function formatDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function monthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : '0000-00';
}

function monthLabel(key) {
  const d = new Date(`${key}-01T00:00:00`);
  const label = d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function groupByMonth(items) {
  const map = new Map();
  for (const item of items) {
    const key = monthKey(item.data);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, list]) => ({ key, label: monthLabel(key), items: list }));
}

export default function ServiceReport() {
  const [type, setType] = useState('operatore');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const groups = useMemo(() => groupByMonth(result?.items || []), [result]);

  async function search(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getServiceReport(type, query.trim());
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Report servizi</div>
      <form onSubmit={search}>
        <div className="row-2" style={{ marginBottom: 10 }}>
          <button
            type="button"
            className={type === 'operatore' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setType('operatore')}
          >
            Per operatore
          </button>
          <button
            type="button"
            className={type === 'sito' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setType('sito')}
          >
            Per sito
          </button>
        </div>
        <div className="field" style={{ marginBottom: 10 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={type === 'operatore' ? 'Cerca nominativo...' : 'Cerca sito/locale/evento...'}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Ricerca...' : 'Cerca'}
        </button>
      </form>

      {error && <div className="error-banner" style={{ marginTop: 14 }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 10 }}>
            {result.total} {result.total === 1 ? 'servizio trovato' : 'servizi trovati'}
          </div>
          {groups.map((g) => (
            <div key={g.key} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <strong style={{ fontSize: 14 }}>{g.label}</strong>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                  {g.items.length} {g.items.length === 1 ? 'servizio' : 'servizi'}
                </span>
              </div>
              {g.items.map((item, idx) => (
                <div className="protocol-card" key={idx} style={{ marginBottom: 8, padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600 }}>
                    {type === 'operatore' ? item.sito : item.operatore}
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                    {formatDate(item.data)} · {item.orario_inizio} - {item.orario_fine}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
