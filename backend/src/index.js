const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const pool = require('./db');
const { sendMonthlyReport, previousMonth } = require('./monthlyReport');

const operatorsRoutes = require('./routes/operators');
const sitesRoutes = require('./routes/sites');
const communicationsRoutes = require('./routes/communications');
const reportsRoutes = require('./routes/reports');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/operators', operatorsRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/communications', communicationsRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Errore interno' });
});

async function bootstrap() {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'init.sql'), 'utf8');
  await pool.query(schema);

  cron.schedule(
    '5 0 1 * *',
    async () => {
      const { year, month } = previousMonth();
      console.log(`Invio report mensile automatico per ${month}/${year}...`);
      try {
        const result = await sendMonthlyReport(year, month);
        console.log(`Report mensile ${month}/${year}: ${result.sendStatus}`);
      } catch (err) {
        console.error('Errore invio report mensile:', err);
      }
    },
    { timezone: 'Europe/Rome' }
  );

  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Backend in ascolto sulla porta ${port}`));
}

bootstrap().catch((err) => {
  console.error('Errore avvio:', err);
  process.exit(1);
});
