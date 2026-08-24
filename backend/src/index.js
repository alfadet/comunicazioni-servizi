const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const authRoutes = require('./routes/auth');
const operatorsRoutes = require('./routes/operators');
const communicationsRoutes = require('./routes/communications');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/operators', operatorsRoutes);
app.use('/api/communications', communicationsRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Errore interno' });
});

async function bootstrap() {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'init.sql'), 'utf8');
  await pool.query(schema);

  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (adminUser && adminPass) {
    const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [adminUser]);
    if (!rows[0]) {
      const hash = await bcrypt.hash(adminPass, 10);
      await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [adminUser, hash]);
      console.log(`Utente admin "${adminUser}" creato`);
    }
  }

  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Backend in ascolto sulla porta ${port}`));
}

bootstrap().catch((err) => {
  console.error('Errore avvio:', err);
  process.exit(1);
});
