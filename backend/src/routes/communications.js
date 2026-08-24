const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../auth');
const { buildEmailContent, sendCommunicationEmail } = require('../email');
const { generateCommunicationPdf } = require('../pdf');

const router = express.Router();
router.use(requireAuth);

function validateProtocols(protocols) {
  if (!Array.isArray(protocols) || protocols.length === 0) {
    return 'Aggiungi almeno un protocollo operativo';
  }
  for (const p of protocols) {
    if (!p.sito || !p.data || !p.orario_inizio || !p.orario_fine) {
      return 'Sito, data e orario sono obbligatori per ogni protocollo';
    }
    if (!Array.isArray(p.unita) || p.unita.length === 0) {
      return 'Seleziona almeno un\'unità assegnata per ogni protocollo';
    }
  }
  return null;
}

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, subject, sent_at, send_status, protocols FROM communications ORDER BY sent_at DESC LIMIT 200'
  );
  res.json(rows);
});

router.get('/report', async (req, res) => {
  const type = req.query.type;
  const query = (req.query.query || '').trim().toUpperCase();
  if (!['operatore', 'sito'].includes(type) || !query) {
    return res.status(400).json({ error: 'Parametri di ricerca mancanti' });
  }

  const { rows } = await pool.query('SELECT protocols FROM communications');
  const items = [];

  for (const row of rows) {
    for (const p of row.protocols || []) {
      const unita = Array.isArray(p.unita) ? p.unita : [];
      if (type === 'sito') {
        if (!p.sito || !p.sito.toUpperCase().includes(query)) continue;
        for (const operatore of unita) {
          items.push({ operatore, sito: p.sito, data: p.data, orario_inizio: p.orario_inizio, orario_fine: p.orario_fine });
        }
      } else {
        for (const operatore of unita) {
          if (!operatore.toUpperCase().includes(query)) continue;
          items.push({ operatore, sito: p.sito, data: p.data, orario_inizio: p.orario_inizio, orario_fine: p.orario_fine });
        }
      }
    }
  }

  items.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  res.json({ total: items.length, items });
});

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM communications WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Non trovata' });
  res.json(rows[0]);
});

router.get('/:id/pdf', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM communications WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Non trovata' });
  generateCommunicationPdf(res, rows[0]);
});

router.post('/', async (req, res) => {
  const protocols = req.body?.protocols;
  const error = validateProtocols(protocols);
  if (error) return res.status(400).json({ error });

  const { subject, body } = buildEmailContent(protocols);

  let sendStatus = 'sent';
  let sendError = null;
  try {
    await sendCommunicationEmail(subject, body);
  } catch (err) {
    sendStatus = 'failed';
    sendError = err.message;
  }

  const { rows } = await pool.query(
    `INSERT INTO communications (subject, body_text, protocols, created_by, send_status, send_error)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, subject, sent_at, send_status, send_error`,
    [subject, body, JSON.stringify(protocols), req.user?.username || null, sendStatus, sendError]
  );

  if (sendStatus === 'failed') {
    return res.status(502).json({ error: `Email non inviata: ${sendError}`, communication: rows[0] });
  }
  res.status(201).json(rows[0]);
});

router.post('/preview', async (req, res) => {
  const protocols = req.body?.protocols;
  const error = validateProtocols(protocols);
  if (error) return res.status(400).json({ error });
  res.json(buildEmailContent(protocols));
});

module.exports = router;
