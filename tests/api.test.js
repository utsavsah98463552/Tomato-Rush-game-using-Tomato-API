/**
 * Integration tests: start the real Express app on a random port and talk to it over
 * HTTP, exactly like the browser does (register -> cookie -> play -> leaderboard).
 */
'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');

// Settings must be in place BEFORE the server modules are loaded.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tomato-test-'));
process.env.DATA_FILE = path.join(tmpDir, 'db.json');
process.env.TOMATO_API_URL = 'http://127.0.0.1:9/'; // nothing listens here -> offline fallback
process.env.API_TIMEOUT_MS = '500';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server/server');

let server;
let base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
  server.close();
  server.closeAllConnections?.();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function call(method, url, { body, cookie } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json(), setCookie: res.headers.get('set-cookie') };
}

const sessionCookie = (setCookie) => setCookie.split(';')[0];

test('full journey: register, play a game, appear on the leaderboard', async () => {
  const reg = await call('POST', '/api/auth/register', { body: { username: 'tester', password: 'password123' } });
  assert.equal(reg.status, 201);
  assert.match(reg.setCookie, /tr_session=/);
  assert.match(reg.setCookie, /HttpOnly/i);
  assert.match(reg.setCookie, /SameSite=Strict/i);
  const cookie = sessionCookie(reg.setCookie);

  const me = await call('GET', '/api/auth/me', { cookie });
  assert.equal(me.body.username, 'tester');

  const start = await call('POST', '/api/game/start', { cookie, body: { difficulty: 'hard' } });
  assert.equal(start.status, 201);
  const id = start.body.gameId;

  const puzzle = await call('POST', `/api/game/${id}/next`, { cookie });
  assert.equal(puzzle.status, 200);
  assert.equal(puzzle.body.source, 'offline'); // API unreachable -> fallback worked
  assert.equal('solution' in puzzle.body, false);

  const answer = await call('POST', `/api/game/${id}/answer`, { cookie, body: { answer: null } });
  assert.equal(answer.body.correct, false);

  const quit = await call('POST', `/api/game/${id}/quit`, { cookie });
  assert.equal(quit.body.username, 'tester');

  const board = await call('GET', '/api/leaderboard');
  assert.ok(board.body.some((row) => row.username === 'tester'));

  const stats = await call('GET', '/api/leaderboard/me', { cookie });
  assert.equal(stats.body.gamesPlayed, 1);
});

test('game routes need a valid session cookie', async () => {
  const noCookie = await call('POST', '/api/game/start', { body: {} });
  assert.equal(noCookie.status, 401);
  const forged = await call('POST', '/api/game/start', { cookie: 'tr_session=not.a.real.token', body: {} });
  assert.equal(forged.status, 401);
});

test('weak passwords and duplicate usernames are refused', async () => {
  const weak = await call('POST', '/api/auth/register', { body: { username: 'bob', password: '123' } });
  assert.equal(weak.status, 400);
  await call('POST', '/api/auth/register', { body: { username: 'carol', password: 'password123' } });
  const dup = await call('POST', '/api/auth/register', { body: { username: 'CAROL', password: 'password123' } });
  assert.equal(dup.status, 409);
});

test('passwords are stored as bcrypt hashes, never in plain text', () => {
  const db = JSON.parse(fs.readFileSync(process.env.DATA_FILE, 'utf8'));
  const user = db.users.find((u) => u.username === 'tester');
  assert.match(user.passwordHash, /^\$2[aby]\$10\$/);
  assert.equal(JSON.stringify(db).includes('password123'), false);
});

test('login reports the previous login and throttles repeated failures by IP', async () => {
  const ok = await call('POST', '/api/auth/login', { body: { username: 'tester', password: 'password123' } });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.previousLogin && ok.body.previousLogin.ip);

  for (let i = 0; i < 5; i++) {
    const bad = await call('POST', '/api/auth/login', { body: { username: 'tester', password: 'wrong-password' } });
    assert.equal(bad.status, 401);
  }
  const blocked = await call('POST', '/api/auth/login', { body: { username: 'tester', password: 'password123' } });
  assert.equal(blocked.status, 429);
});
