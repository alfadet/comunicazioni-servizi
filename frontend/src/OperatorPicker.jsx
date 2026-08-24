import React, { useMemo, useState } from 'react';

export default function OperatorPicker({ operators, initialSelected, onClose, onConfirm }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set(initialSelected));

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    const list = operators.filter((o) => o.attivo !== false);
    const matching = q ? list.filter((o) => o.nome.includes(q)) : list;
    return [...matching].sort((a, b) => {
      const aSel = selected.has(a.nome) ? 0 : 1;
      const bSel = selected.has(b.nome) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return a.nome.localeCompare(b.nome);
    });
  }, [operators, search, selected]);

  function toggle(nome) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome);
      else next.add(nome);
      return next;
    });
  }

  return (
    <div className="operator-picker">
      <div className="picker-header">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Cerca operatore ({selected.size} selezionati)</label>
          <input
            type="search"
            autoFocus
            placeholder="Cerca per nominativo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="picker-list">
        {filtered.length === 0 && <div className="empty-state">Nessun operatore trovato</div>}
        {filtered.map((o) => (
          <label className="operator-row" key={o.id}>
            <input type="checkbox" checked={selected.has(o.nome)} onChange={() => toggle(o.nome)} />
            {o.nome}
          </label>
        ))}
      </div>
      <div className="picker-footer" style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
        <button className="btn btn-primary" onClick={() => onConfirm([...selected])}>Conferma</button>
      </div>
    </div>
  );
}
