import React, { useState } from 'react';
import { api } from './api.js';

export default function OperatorsPanel({ operators, reload }) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);

  async function add(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    try {
      await api.addOperator(newName);
      setNewName('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveEdit(id) {
    if (!editingName.trim()) return;
    try {
      await api.updateOperator(id, { nome: editingName, attivo: true });
      setEditingId(null);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Cancellare questo nominativo?')) return;
    await api.deleteOperator(id);
    reload();
  }

  async function runImport(e) {
    e.preventDefault();
    const nomi = importText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (nomi.length === 0) return;
    setImporting(true);
    setError('');
    setImportResult(null);
    try {
      const result = await api.importOperators(nomi);
      setImportResult(result);
      setImportText('');
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Gestione operatori</h2>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={add} className="card">
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Nuovo nominativo</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Es. ROSSI MARIO"
          />
        </div>
        <button className="btn btn-primary" type="submit">+ Aggiungi</button>
      </form>

      <div className="card">
        <button className="btn-ghost" style={{ padding: 0 }} onClick={() => setShowImport((v) => !v)}>
          {showImport ? '− Nascondi import lista' : '+ Importa lista (incolla più nominativi)'}
        </button>
        {showImport && (
          <form onSubmit={runImport} style={{ marginTop: 12 }}>
            <div className="field" style={{ marginBottom: 10 }}>
              <label>Un nominativo per riga (copia dal foglio Excel/Google Sheets)</label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={'ROSSI MARIO\nBIANCHI LUCA\n...'}
                rows={6}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={importing}>
              {importing ? 'Importazione...' : 'Importa'}
            </button>
            {importResult && (
              <div className="success-banner" style={{ marginTop: 10, marginBottom: 0 }}>
                {importResult.inserted} aggiunti, {importResult.skipped} già presenti (saltati)
              </div>
            )}
          </form>
        )}
      </div>

      {operators.map((o) => (
        <div className="card" key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {editingId === o.id ? (
            <>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn-ghost" onClick={() => saveEdit(o.id)}>Salva</button>
              <button className="btn-ghost" onClick={() => setEditingId(null)}>Annulla</button>
            </>
          ) : (
            <>
              <span style={{ flex: 1 }}>{o.nome}</span>
              <button
                className="btn-ghost"
                onClick={() => {
                  setEditingId(o.id);
                  setEditingName(o.nome);
                }}
              >
                Modifica
              </button>
              <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => remove(o.id)}>
                Elimina
              </button>
            </>
          )}
        </div>
      ))}
      {operators.length === 0 && <div className="empty-state">Nessun operatore inserito</div>}
    </div>
  );
}
