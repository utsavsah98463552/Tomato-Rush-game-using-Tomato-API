'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoginLimiter } = require('../server/auth/rateLimiter');

function fakeRes() {
  return {
    statusCode: 200, headers: {}, body: null,
    set(k, v) { this.headers[k] = v; return this; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

test('blocks an IP after too many failures and unblocks after the window', () => {
  let time = 0;
  const limiter = createLoginLimiter({ maxFailures: 3, windowMs: 1000, now: () => time });
  const req = { ip: '10.0.0.1' };

  for (let i = 0; i < 3; i++) limiter.recordFailure(req.ip);

  let nextCalled = false;
  const res = fakeRes();
  limiter.middleware(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 429);
  assert.ok(res.headers['Retry-After']);

  // other IPs are not affected
  limiter.middleware({ ip: '10.0.0.2' }, fakeRes(), () => { nextCalled = true; });
  assert.equal(nextCalled, true);

  time += 1001;
  nextCalled = false;
  limiter.middleware(req, fakeRes(), () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});
