const express = require('express');
const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, nome, attivo FROM operators ORDER BY nome ASC'
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const nome = (req.body?.nome || '').trim().toUpperCase();
  if (!nome) return res.status(400).json({ error: 'Nome obbligatorio' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO operators (nome) VALUES ($1) RETURNING id, nome, attivo',
      [nome]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Nominativo già presente' });
    }
    throw err;
  }
});

router.post('/bulk', async (req, res) => {
  const nomi = Array.isArray(req.body?.nomi) ? req.body.nomi : [];
  const clean = [...new Set(nomi.map((n) => (n || '').trim().toUpperCase()).filter(Boolean))];
  if (clean.length === 0) return res.status(400).json({ error: 'Nessun nominativo valido' });

  let inserted = 0;
  for (const nome of clean) {
    const { rowCount } = await pool.query(
      'INSERT INTO operators (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING',
      [nome]
    );
    inserted += rowCount;
  }
  res.status(201).json({ inserted, skipped: clean.length - inserted, total: clean.length });
});

router.put('/:id', async (req, res) => {
  const nome = (req.body?.nome || '').trim().toUpperCase();
  const attivo = req.body?.attivo !== undefined ? !!req.body.attivo : true;
  if (!nome) return res.status(400).json({ error: 'Nome obbligatorio' });
  const { rows } = await pool.query(
    'UPDATE operators SET nome = $1, attivo = $2 WHERE id = $3 RETURNING id, nome, attivo',
    [nome, attivo, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Non trovato' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM operators WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

module.exports = router;
