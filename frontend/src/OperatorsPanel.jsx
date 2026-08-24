import React, { useState } from 'react';
import { api } from './api.js';

export default function OperatorsPanel({ operators, reload }) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

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
