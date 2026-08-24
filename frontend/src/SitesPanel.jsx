import React, { useState } from 'react';
import { api } from './api.js';

export default function SitesPanel({ sites, reload }) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  async function add(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    try {
      await api.addSite(newName);
      setNewName('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveEdit(id) {
    if (!editingName.trim()) return;
    try {
      await api.updateSite(id, { nome: editingName, attivo: true });
      setEditingId(null);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Cancellare questo sito?')) return;
    await api.deleteSite(id);
    reload();
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Gestione siti / locali / eventi</h2>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={add} className="card">
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Nuovo sito</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Es. CALDONAZZO (PIAZZA)"
          />
        </div>
        <button className="btn btn-primary" type="submit">+ Aggiungi</button>
      </form>

      {sites.map((s) => (
        <div className="card" key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {editingId === s.id ? (
            <>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn-ghost" onClick={() => saveEdit(s.id)}>Salva</button>
              <button className="btn-ghost" onClick={() => setEditingId(null)}>Annulla</button>
            </>
          ) : (
            <>
              <span style={{ flex: 1 }}>{s.nome}</span>
              <button
                className="btn-ghost"
                onClick={() => {
                  setEditingId(s.id);
                  setEditingName(s.nome);
                }}
              >
                Modifica
              </button>
              <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => remove(s.id)}>
                Elimina
              </button>
            </>
          )}
        </div>
      ))}
      {sites.length === 0 && <div className="empty-state">Nessun sito inserito</div>}
    </div>
  );
}
