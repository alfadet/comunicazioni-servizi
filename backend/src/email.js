const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function formatDateItalian(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function buildEmailContent(protocols) {
  const subject = `COMUNICAZIONE SERVIZI - ALFA SECURITY - ${formatDateItalian(new Date())}`;

  const blocks = protocols.map((p, idx) => {
    const unita = p.unita.join(', ');
    const note = p.note && p.note.trim() ? p.note.trim() : 'NESSUNA SPECIFICA RILEVATA';
    return [
      `PROTOCOLLO OPERATIVO #${idx + 1}`,
      `SITO: ${p.sito}`,
      `DATA: ${p.data}`,
      `ORARIO: ${p.orario_inizio} - ${p.orario_fine}`,
      `UNITÀ ASSEGNATE: ${unita}`,
      `NOTE: ${note}`,
      '------------------------------------',
    ].join('\n');
  });

  const body = [
    'Protocollo Operativo Servizi A.s.c Alfa Security',
    '================================================',
    '',
    blocks.join('\n\n'),
  ].join('\n');

  return { subject, body };
}

async function sendCommunicationEmail(subject, body) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject,
    text: body,
  });
}

module.exports = { buildEmailContent, sendCommunicationEmail };
