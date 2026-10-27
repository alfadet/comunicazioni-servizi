const express = require('express');
const pool = require('../db');
const { buildEmailContent, sendCommunicationEmail } = require('../email');
const { generateCommunicationPdf } = require('../pdf');

const router = express.Router();

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
  const current = { ...rows[0], body_text: buildEmailContent(rows[0].protocols).body };
  generateCommunicationPdf(res, current);
});

// Correzioni sullo storico: non inviano nessuna email, modificano solo i dati salvati.
// sito+data vengono ricontrollati sul protocollo all'indice indicato, così una
// modifica concorrente non può colpire il protocollo sbagliato.
async function editProtocols(req, res, mutate) {
  const idx = parseInt(req.params.idx, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT protocols FROM communications WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Comunicazione non trovata' });
    }
    const protocols = rows[0].protocols;
    const p = protocols[idx];
    if (!p || p.sito !== req.query.sito || p.data !== req.query.data) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'I dati sono cambiati, ricarica la pagina e riprova' });
    }

    const outcome = mutate(protocols, idx, p);
    if (outcome.error) {
      await client.query('ROLLBACK');
      return res.status(outcome.status).json({ error: outcome.error });
    }

    if (outcome.deleteCommunication) {
      await client.query('DELETE FROM communications WHERE id = $1', [req.params.id]);
    } else {
      await client.query(
        'UPDATE communications SET protocols = $1, edited_at = now() WHERE id = $2',
        [JSON.stringify(outcome.protocols), req.params.id]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true, deletedCommunication: !!outcome.deleteCommunication });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Errore interno' });
  } finally {
    client.release();
  }
}

router.post('/:id/protocols/:idx/operators', async (req, res) => {
  const nomi = Array.isArray(req.body?.nomi)
    ? [...new Set(req.body.nomi.map((n) => String(n || '').trim().toUpperCase()).filter(Boolean))]
    : [];
  if (nomi.length === 0) return res.status(400).json({ error: 'Seleziona almeno un operatore' });

  const { rows } = await pool.query('SELECT nome FROM operators WHERE nome = ANY($1)', [nomi]);
  if (rows.length !== nomi.length) {
    return res.status(400).json({ error: 'Operatore non presente in elenco' });
  }

  return editProtocols(req, res, (protocols, idx, p) => {
    const unita = Array.isArray(p.unita) ? p.unita : [];
    const nuovi = nomi.filter((n) => !unita.includes(n));
    if (nuovi.length === 0) {
      return { status: 409, error: 'Gli operatori scelti sono già in questo protocollo' };
    }
    return {
      protocols: protocols.map((x, i) => (i === idx ? { ...x, unita: [...unita, ...nuovi] } : x)),
    };
  });
});

router.delete('/:id/protocols/:idx/operators/:nome', (req, res) =>
  editProtocols(req, res, (protocols, idx, p) => {
    const unita = Array.isArray(p.unita) ? p.unita : [];
    if (!unita.includes(req.params.nome)) {
      return { status: 404, error: 'Operatore non presente in questo protocollo' };
    }
    if (unita.length <= 1) {
      return {
        status: 409,
        error: 'È l\'ultimo operatore del protocollo: per toglierlo elimina l\'intero protocollo',
      };
    }
    const updated = protocols.map((x, i) =>
      i === idx ? { ...x, unita: unita.filter((u) => u !== req.params.nome) } : x
    );
    return { protocols: updated };
  })
);

router.delete('/:id/protocols/:idx', (req, res) =>
  editProtocols(req, res, (protocols, idx) => {
    if (protocols.length === 1) return { deleteCommunication: true };
    return { protocols: protocols.filter((_, i) => i !== idx) };
  })
);

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
