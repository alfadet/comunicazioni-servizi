const crypto = require('crypto');

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// La chiave dipende anche dalla password: cambiandola, tutte le sessioni esistenti decadono.
function signingKey() {
  return crypto
    .createHash('sha256')
    .update(`${process.env.SESSION_SECRET}:${process.env.APP_PASSWORD}`)
    .digest();
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function createToken() {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', signingKey()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (typeof token !== 'string') return false;
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const expected = crypto.createHmac('sha256', signingKey()).update(body).digest('base64url');
  if (sig.length !== expected.length || !safeEqual(sig, expected)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(body, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!verifyToken(token)) return res.status(401).json({ error: 'Accesso richiesto' });
  next();
}

function createLoginLimiter({ max = 8, windowMs = 15 * 60 * 1000, now = () => Date.now() } = {}) {
  const attempts = new Map();
  return {
    // Restituisce i ms di blocco residui (0 = nessun blocco).
    check(ip) {
      const e = attempts.get(ip);
      if (!e) return 0;
      if (now() - e.first > windowMs) {
        attempts.delete(ip);
        return 0;
      }
      return e.count >= max ? windowMs - (now() - e.first) : 0;
    },
    fail(ip) {
      const e = attempts.get(ip);
      if (!e || now() - e.first > windowMs) attempts.set(ip, { count: 1, first: now() });
      else e.count += 1;
    },
    reset(ip) {
      attempts.delete(ip);
    },
  };
}

function clientIp(req) {
  return req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown';
}

module.exports = { createToken, verifyToken, requireAuth, safeEqual, createLoginLimiter, clientIp };
