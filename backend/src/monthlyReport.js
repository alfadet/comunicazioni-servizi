const pool = require('./db');
const { sendCommunicationEmail } = require('./email');

const MESI_IT = [
  'GENNAIO', 'FEBBRAIO', 'MARZO', 'APRILE', 'MAGGIO', 'GIUGNO',
  'LUGLIO', 'AGOSTO', 'SETTEMBRE', 'OTTOBRE', 'NOVEMBRE', 'DICEMBRE',
];

async function getMonthServices(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const { rows } = await pool.query('SELECT protocols FROM communications');
  const services = [];
  for (const row of rows) {
    for (const p of row.protocols || []) {
      if (!p.data || !p.data.startsWith(prefix)) continue;
      const unita = Array.isArray(p.unita) ? p.unita : [];
      for (const operatore of unita) {
        services.push({ operatore, sito: p.sito });
      }
    }
  }
  return services;
}

function countBy(services, key) {
  const counts = new Map();
  for (const s of services) {
    counts.set(s[key], (counts.get(s[key]) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function buildReportContent(year, month, services) {
  const monthLabel = `${MESI_IT[month - 1]} ${year}`;
  const subject = `RIEPILOGO MENSILE SERVIZI - ALFA SECURITY - ${monthLabel}`;

  const perSito = countBy(services, 'sito');
  const perOperatore = countBy(services, 'operatore');

  const sitoLines = perSito.length
    ? perSito.map(([sito, n]) => `${sito}: ${n}`).join('\n')
    : 'Nessun servizio registrato';

  const operatoreLines = perOperatore.length
    ? perOperatore.map(([op, n]) => `${op}: ${n}`).join('\n')
    : 'Nessun servizio registrato';

  const body = [
    'Riepilogo Mensile Servizi A.s.c Alfa Security',
    '================================================',
    '',
    `MESE: ${monthLabel}`,
    `TOTALE SERVIZI: ${services.length}`,
    '',
    'SERVIZI PER SITO / LOCALE / EVENTO:',
    '------------------------------------',
    sitoLines,
    '',
    'SERVIZI PER OPERATORE:',
    '------------------------------------',
    operatoreLines,
  ].join('\n');

  return { subject, body };
}

async function sendMonthlyReport(year, month) {
  const services = await getMonthServices(year, month);
  const { subject, body } = buildReportContent(year, month, services);

  let sendStatus = 'sent';
  let sendError = null;
  try {
    await sendCommunicationEmail(subject, body);
  } catch (err) {
    sendStatus = 'failed';
    sendError = err.message;
  }

  await pool.query(
    `INSERT INTO monthly_reports (report_year, report_month, subject, body_text, send_status, send_error)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [year, month, subject, body, sendStatus, sendError]
  );

  return { subject, body, sendStatus, sendError, total: services.length };
}

function previousMonth(referenceDate = new Date()) {
  const lastDayPrevMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0);
  return { year: lastDayPrevMonth.getFullYear(), month: lastDayPrevMonth.getMonth() + 1 };
}

async function getMonthSummary(year, month) {
  const services = await getMonthServices(year, month);
  return {
    year,
    month,
    monthLabel: `${MESI_IT[month - 1]} ${year}`,
    total: services.length,
    perSito: countBy(services, 'sito'),
    perOperatore: countBy(services, 'operatore'),
  };
}

module.exports = {
  sendMonthlyReport,
  buildReportContent,
  getMonthServices,
  getMonthSummary,
  previousMonth,
};
