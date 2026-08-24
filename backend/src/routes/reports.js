const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../auth');
const { sendMonthlyReport, previousMonth } = require('../monthlyReport');

const router = express.Router();
router.use(requireAuth);

router.get('/monthly', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, report_year, report_month, subject, sent_at, send_status FROM monthly_reports ORDER BY sent_at DESC LIMIT 50'
  );
  res.json(rows);
});

router.post('/monthly/send', async (req, res) => {
  const { year, month } = req.body?.year && req.body?.month ? req.body : previousMonth();
  const result = await sendMonthlyReport(year, month);
  if (result.sendStatus === 'failed') {
    return res.status(502).json({ error: `Email non inviata: ${result.sendError}`, ...result });
  }
  res.status(201).json(result);
});

module.exports = router;
