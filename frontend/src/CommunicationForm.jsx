import React, { useRef, useState } from 'react';
import OperatorPicker from './OperatorPicker.jsx';
import SitePicker from './SitePicker.jsx';
import { api } from './api.js';

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function emptyProtocol() {
  return { sito: '', data: todayISO(), orario_inizio: '', orario_fine: '', unita: [], note: '' };
}

export default function CommunicationForm({ operators, sites, initialProtocols, onSent }) {
  const [protocols, setProtocols] = useState(initialProtocols?.length ? initialProtocols : [emptyProtocol()]);
  const [pickerIndex, setPickerIndex] = useState(null);
  const [sitePickerIndex, setSitePickerIndex] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const sendingRef = useRef(false);

  function updateProtocol(idx, patch) {
    setProtocols((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  function addProtocol() {
    setProtocols((prev) => [...prev, emptyProtocol()]);
  }

  function removeProtocol(idx) {
    setProtocols((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeUnit(idx, nome) {
    updateProtocol(idx, { unita: protocols[idx].unita.filter((u) => u !== nome) });
  }

  async function goToReview() {
    setError('');
    try {
      const data = await api.previewCommunication(protocols);
      setPreview(data);
      setReviewing(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmSend() {
    // sendingRef è sincrono (a differenza dello stato React) e blocca sul colpo
    // eventuali doppi tap/click che arrivano prima che il bottone si disabiliti a schermo.
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError('');
    try {
      await api.sendCommunication(protocols);
      setSuccess('Comunicazione inviata correttamente.');
      setReviewing(false);
      setProtocols([emptyProtocol()]);
      onSent?.();
    } catch (err) {
      setError(err.message);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  if (reviewing && preview) {
    return (
      <div>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Anteprima comunicazione</h2>
        <div className="card">
          <div className="field">
            <label>Oggetto</label>
            <div>{preview.subject}</div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Corpo email</label>
            <pre className="preview-body">{preview.body}</pre>
          </div>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginBottom: 90 }}>
          <button className="btn btn-secondary" onClick={() => setReviewing(false)} disabled={sending}>
            Modifica
          </button>
          <button className="btn btn-primary" onClick={confirmSend} disabled={sending}>
            {sending ? 'Invio in corso...' : 'Conferma e invia'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {success && <div className="success-banner">{success}</div>}
      {error && <div className="error-banner">{error}</div>}

      {protocols.map((p, idx) => (
        <div className="protocol-card" key={idx}>
          <div className="protocol-header">
            <span className="protocol-title">PROTOCOLLO OPERATIVO #{idx + 1}</span>
            {protocols.length > 1 && (
              <button className="btn-ghost" onClick={() => removeProtocol(idx)}>Rimuovi</button>
            )}
          </div>

          <div className="field">
            <label>Sito / Locale / Evento</label>
            <button className="btn btn-secondary" onClick={() => setSitePickerIndex(idx)}>
              {p.sito ? p.sito : '+ Seleziona sito'}
            </button>
          </div>

          <div className="field">
            <label>Data</label>
            <input
              type="date"
              value={p.data}
              onChange={(e) => updateProtocol(idx, { data: e.target.value })}
              onClick={(e) => e.target.showPicker?.()}
            />
          </div>

          <div className="row-2" style={{ marginBottom: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Orario inizio</label>
              <input
                type="time"
                value={p.orario_inizio}
                onChange={(e) => updateProtocol(idx, { orario_inizio: e.target.value })}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Orario fine</label>
              <input
                type="time"
                value={p.orario_fine}
                onChange={(e) => updateProtocol(idx, { orario_fine: e.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label>Unità assegnate</label>
            <button className="btn btn-secondary" onClick={() => setPickerIndex(idx)}>
              + Seleziona operatori
            </button>
            <div className="chip-list">
              {p.unita.map((u) => (
                <span className="chip" key={u}>
                  {u}
                  <button onClick={() => removeUnit(idx, u)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label>Note</label>
            <textarea
              value={p.note}
              onChange={(e) => updateProtocol(idx, { note: e.target.value })}
              placeholder="NESSUNA SPECIFICA RILEVATA"
            />
          </div>
        </div>
      ))}

      <button className="btn btn-secondary" onClick={addProtocol} style={{ marginBottom: 100 }}>
        + Aggiungi protocollo
      </button>

      {pickerIndex !== null && (
        <OperatorPicker
          operators={operators}
          initialSelected={protocols[pickerIndex].unita}
          onClose={() => setPickerIndex(null)}
          onConfirm={(names) => {
            updateProtocol(pickerIndex, { unita: names });
            setPickerIndex(null);
          }}
        />
      )}

      {sitePickerIndex !== null && (
        <SitePicker
          sites={sites}
          onClose={() => setSitePickerIndex(null)}
          onSelect={(nome) => {
            updateProtocol(sitePickerIndex, { sito: nome });
            setSitePickerIndex(null);
          }}
        />
      )}

      <div className="sticky-actions">
        <button className="btn btn-primary" onClick={goToReview}>
          Rivedi e invia
        </button>
      </div>
    </div>
  );
}
