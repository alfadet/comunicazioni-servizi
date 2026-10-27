const express = require('express');
const { createToken, safeEqual, createLoginLimiter, clientIp } = require('../auth');

const router = express.Router();
const limiter = createLoginLimiter();

router.post('/login', (req, res) => {
  const ip = clientIp(req);
  const lockedMs = limiter.check(ip);
  if (lockedMs > 0) {
    return res
      .status(429)
      .json({ error: `Troppi tentativi errati. Riprova tra ${Math.ceil(lockedMs / 60000)} minuti.` });
  }

  const password = String(req.body?.password ?? '');
  if (!safeEqual(password, process.env.APP_PASSWORD)) {
    limiter.fail(ip);
    return res.status(401).json({ error: 'Password errata' });
  }

  limiter.reset(ip);
  res.json({ token: createToken() });
});

module.exports = router;
