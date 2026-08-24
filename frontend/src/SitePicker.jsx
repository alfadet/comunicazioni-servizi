import React, { useMemo, useState } from 'react';

export default function SitePicker({ sites, onClose, onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    const list = sites.filter((s) => s.attivo !== false);
    const matching = q ? list.filter((s) => s.nome.includes(q)) : list;
    return [...matching].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [sites, search]);

  return (
    <div className="operator-picker">
      <div className="picker-header">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Cerca sito / locale / evento</label>
          <input
            type="search"
            autoFocus
            placeholder="Cerca per nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="picker-list">
        {filtered.length === 0 && <div className="empty-state">Nessun sito trovato</div>}
        {filtered.map((s) => (
          <div className="operator-row" key={s.id} onClick={() => onSelect(s.nome)} style={{ cursor: 'pointer' }}>
            {s.nome}
          </div>
        ))}
      </div>
      <div className="picker-footer">
        <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
      </div>
    </div>
  );
}
