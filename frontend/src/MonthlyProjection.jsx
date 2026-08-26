import React, { useEffect, useMemo, useState } from 'react';
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

function formatEuro(n) {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

const CHART_HEIGHT = 150;
const BAR_GAP = 2;

function BarChart({ perGiorno, margineUnitario }) {
  const [selected, setSelected] = useState(null);
  const max = Math.max(1, ...perGiorno.map((d) => d.count));
  const n = perGiorno.length;
  const width = 100; // viewBox units, scales via CSS width:100%
  const barWidth = (width - (n - 1) * BAR_GAP) / n;
  const active = selected != null ? perGiorno[selected] : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
          SERVIZI PER GIORNO
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
          {active
            ? `Giorno ${active.giorno}: ${active.count} servizi · ${formatEuro(active.count * margineUnitario)}`
            : 'Tocca una barra per i dettagli'}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${CHART_HEIGHT}`} width="100%" height={CHART_HEIGHT} preserveAspectRatio="none">
        <line x1="0" y1={CHART_HEIGHT - 16} x2={width} y2={CHART_HEIGHT - 16} stroke="var(--border)" strokeWidth="0.5" />
        {perGiorno.map((d, i) => {
          const h = (d.count / max) * (CHART_HEIGHT - 32);
          const x = i * (barWidth + BAR_GAP);
          const y = CHART_HEIGHT - 16 - h;
          const isSelected = selected === i;
          const showLabel = n <= 31 && (d.giorno === 1 || d.giorno % 5 === 0);
          return (
            <g key={d.giorno} onClick={() => setSelected(isSelected ? null : i)} style={{ cursor: 'pointer' }}>
              <rect x={x} y={CHART_HEIGHT - 16 - Math.max(h, 1)} width={barWidth} height={Math.max(h, 1)} rx={barWidth > 3 ? 1.2 : 0.5}
                fill={isSelected ? '#60a5fa' : 'var(--accent)'} opacity={isSelected ? 1 : 0.85} />
              <rect x={x} y={0} width={barWidth} height={CHART_HEIGHT} fill="transparent" />
              {showLabel && (
                <text x={x + barWidth / 2} y={CHART_HEIGHT - 4} fontSize="3.6" textAnchor="middle" fill="var(--text-dim)">
                  {d.giorno}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function MonthlyProjection() {
  const [{ year, month }, setYearMonth] = useState(nowYearMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .getMonthProjection(year, month)
      .then(setData)
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

  const chartData = useMemo(() => data?.perGiorno || [], [data]);

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Mese precedente">
            <IconChevronLeft size={20} />
          </button>
          <strong style={{ fontSize: 15, letterSpacing: '0.01em' }}>{data?.monthLabel || '...'}</strong>
          <button className="icon-btn" onClick={() => shift(1)} disabled={isCurrentMonth(year, month)} aria-label="Mese successivo">
            <IconChevronRight size={20} />
          </button>
        </div>

        {loading && <div className="empty-state">Caricamento...</div>}
        {error && <div className="error-banner">{error}</div>}

        {data && !loading && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 4 }}>
                {isCurrentMonth(year, month) ? 'Margine finora questo mese' : 'Margine totale del mese'}
              </div>
              <div style={{ fontSize: 38, fontWeight: 800, color: 'var(--success)' }}>
                {formatEuro(data.margineTotale)}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 2 }}>
                {data.totalServizi} servizi · {formatEuro(data.margineUnitario)} di margine cadauno
              </div>
            </div>

            <div className="row-2" style={{ marginBottom: 20 }}>
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>Ricavo totale</div>
                <div style={{ fontSize: 19, fontWeight: 700 }}>{formatEuro(data.ricavoTotale)}</div>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>Costo operatori</div>
                <div style={{ fontSize: 19, fontWeight: 700 }}>{formatEuro(data.costoOperatori)}</div>
              </div>
            </div>

            {chartData.length > 0 && (
              <BarChart perGiorno={chartData} margineUnitario={data.margineUnitario} />
            )}

            <div style={{ marginTop: 18, fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
              Calcolato su {formatEuro(data.servicePrice)} a servizio, {formatEuro(data.operatorPayout)} pagati
              all'operatore (tasse incluse)
            </div>
          </>
        )}
      </div>
    </div>
  );
}
