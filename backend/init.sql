CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operators (
  id SERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  attivo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sites (
  id SERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  attivo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communications (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  protocols JSONB NOT NULL,
  created_by TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  send_status TEXT NOT NULL DEFAULT 'sent',
  send_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_communications_sent_at ON communications (sent_at DESC);

CREATE TABLE IF NOT EXISTS monthly_reports (
  id SERIAL PRIMARY KEY,
  report_year INT NOT NULL,
  report_month INT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  send_status TEXT NOT NULL DEFAULT 'sent',
  send_error TEXT
);
