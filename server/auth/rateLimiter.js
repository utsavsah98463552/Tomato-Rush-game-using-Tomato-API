/**
 * rateLimiter.js - slows down password guessing, keyed by the client's IP NUMBER.
 * Author: Utsav Sah
 *
 * After 5 failed logins from the same IP address within 10 minutes, further login
 * attempts from that IP are refused with HTTP 429 until the window has passed.
 * A successful login clears the counter.
 *
 * Limitation (for the video): many students behind one university router share one IP,
 * and an attacker can change IP - so IP is a weak identity signal. A real system would
 * also limit per account and add CAPTCHA or 2FA.
 *
 * Reference: OWASP Authentication Cheat Sheet ("Login Throttling")
 *   https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 */
'use strict';

function createLoginLimiter({ maxFailures = 5, windowMs = 10 * 60 * 1000, now = Date.now } = {}) {
  const failures = new Map(); // ip -> { count, firstAt }

  function entry(ip) {
    const e = failures.get(ip);
    if (e && now() - e.firstAt > windowMs) {
      failures.delete(ip); // window expired
      return null;
    }
    return e || null;
  }

  return {
    /** Express middleware - put in front of the login route. */
    middleware(req, res, next) {
      const e = entry(req.ip);
      if (e && e.count >= maxFailures) {
        const retryAfter = Math.ceil((e.firstAt + windowMs - now()) / 1000);
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({
          error: `Too many failed logins from your network. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
        });
      }
      next();
    },

    recordFailure(ip) {
      const e = entry(ip);
      if (e) e.count += 1;
      else failures.set(ip, { count: 1, firstAt: now() });
    },

    reset(ip) {
      failures.delete(ip);
    },
  };
}

module.exports = { createLoginLimiter };
