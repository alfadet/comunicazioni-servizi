import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import ServiceReport from './ServiceReport.jsx';
import MonthlySummary from './MonthlySummary.jsx';
import OperatorPicker from './OperatorPicker.jsx';

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDataIt(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function History({ communications, operators = [], onDuplicate, onChanged }) {
  const [tab, setTab] = useState('elenco');
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pickerIdx, setPickerIdx] = useState(null);
  const [pendingAdd, setPendingAdd] = useState(null);

  useEffect(() => {
    setEditError('');
    if (openId === null) {
      setDetail(null);
      return;
    }
    setLoading(true);
    api.getCommunication(openId).then(setDetail).finally(() => setLoading(false));
  }, [openId]);

  async function runEdit(action) {
    if (busy) return;
    setBusy(true);
    setEditError('');
    try {
      const result = await action();
      onChanged?.();
      if (result.deletedCommunication) {
        setOpenId(null);
      } else {
        setDetail(await api.getCommunication(openId));
      }
    } catch (err) {
      setEditError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function findConflicts(nomi, p, idx) {
    const found = [];
    for (const c of communications) {
      c.protocols.forEach((q, qi) => {
        if (c.id === detail.id && qi === idx) return;
        if (q.data !== p.data) return;
        for (const n of nomi) {
          if (q.unita.includes(n)) found.push(`${n} risulta già su ${q.sito} lo stesso giorno`);
        }
      });
    }
    return found;
  }

  function confirmAdd() {
    const { idx, p, nomi } = pendingAdd;
    setPendingAdd(null);
    runEdit(() => api.addOperatorsToProtocol(detail.id, idx, p, nomi));
  }

  function removeOperator(idx, p, nome) {
    if (p.unita.length <= 1) {
      setEditError("È l'ultimo operatore del protocollo: per toglierlo elimina l'intero protocollo.");
      return;
    }
    const ok = window.confirm(
      `Sicuro di togliere ${nome} da ${p.sito} (${formatDataIt(p.data)})?\n\n` +
        "L'email già inviata non cambia: viene corretto solo lo storico e i conteggi."
    );
    if (!ok) return;
    runEdit(() => api.removeOperatorFromProtocol(detail.id, idx, p, nome));
  }

  function removeProtocol(idx, p) {
    const ok = window.confirm(
      `Sicuro di eliminare l'intero protocollo ${p.sito} (${formatDataIt(p.data)}) con ${p.unita.length} operatori?\n\n` +
        "L'email già inviata non cambia: viene corretto solo lo storico e i conteggi."
    );
    if (!ok) return;
    runEdit(() => api.deleteProtocol(detail.id, idx, p));
  }

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
              <div className="field" style={{ marginBottom: detail.edited_at ? undefined : 0 }}>
                <label>Inviata il</label>
                <div>{formatDateTime(detail.sent_at)}</div>
              </div>
              {detail.edited_at && (
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Corretta il</label>
                  <div>{formatDateTime(detail.edited_at)}</div>
                </div>
              )}
            </div>

            <h2 style={{ fontSize: 15, margin: '18px 0 4px' }}>Protocolli e operatori</h2>
            <div style={{ color: 'var(--text-dim)', fontSize: 12.5, marginBottom: 10 }}>
              Tocca × per togliere un operatore messo per errore o non disponibile: sparisce dai conteggi.
            </div>
            {editError && <div className="error-banner">{editError}</div>}
            {detail.protocols.map((p, idx) => (
              <div className="protocol-card" key={idx}>
                <div className="protocol-header">
                  <span className="protocol-title">#{idx + 1} · {p.sito}</span>
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 8 }}>
                  {formatDataIt(p.data)} · {p.orario_inizio} - {p.orario_fine}
                </div>
                <div className="chip-list" style={{ marginTop: 0, marginBottom: 12 }}>
                  {p.unita.map((u) => (
                    <span className="chip" key={u}>
                      {u}
                      <button disabled={busy} onClick={() => removeOperator(idx, p, u)} aria-label={`Togli ${u}`}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="row-2">
                  <button className="btn btn-secondary" disabled={busy} onClick={() => setPickerIdx(idx)}>
                    + Aggiungi operatore
                  </button>
                  <button className="btn btn-danger" disabled={busy} onClick={() => removeProtocol(idx, p)}>
                    Elimina protocollo
                  </button>
                </div>
              </div>
            ))}

            {pickerIdx !== null && (
              <OperatorPicker
                operators={operators.filter((o) => !detail.protocols[pickerIdx].unita.includes(o.nome))}
                initialSelected={[]}
                onClose={() => setPickerIdx(null)}
                onConfirm={(nomi) => {
                  const idx = pickerIdx;
                  setPickerIdx(null);
                  if (nomi.length === 0) return;
                  setPendingAdd({ idx, p: detail.protocols[idx], nomi });
                }}
              />
            )}

            {pendingAdd && (
              <div className="confirm-overlay">
                <div className="confirm-modal">
                  <div className="confirm-title">ATTENZIONE</div>
                  <p>
                    Questa funzione serve <strong>solo per riconciliare gli operatori</strong> in caso di
                    scambi e modifiche.
                  </p>
                  <p className="confirm-danger">
                    NON viene inviata nessuna email alla Questura. L'email già inviata resta com'è: cambiano
                    solo storico e conteggi.
                  </p>
                  <div className="confirm-detail">
                    Aggiungere <strong>{pendingAdd.nomi.join(', ')}</strong> a{' '}
                    <strong>{pendingAdd.p.sito}</strong> ({formatDataIt(pendingAdd.p.data)})?
                  </div>
                  {findConflicts(pendingAdd.nomi, pendingAdd.p, pendingAdd.idx).map((msg) => (
                    <div className="confirm-note" key={msg}>⚠ {msg}</div>
                  ))}
                  <div className="row-2" style={{ marginTop: 16 }}>
                    <button className="btn btn-secondary" onClick={() => setPendingAdd(null)}>Annulla</button>
                    <button className="btn btn-primary" onClick={confirmAdd}>Aggiungi</button>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Email originale inviata (non modificabile)</label>
                <pre className="preview-body">{detail.body_text}</pre>
              </div>
            </div>
            <div className="row-2" style={{ marginBottom: 100 }}>
              <button className="btn btn-secondary" onClick={() => api.downloadCommunicationPdf(detail.id)}>
                Scarica PDF
              </button>
              <button className="btn btn-primary" onClick={() => onDuplicate(detail.protocols)}>
                Duplica e modifica
              </button>
            </div>
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
