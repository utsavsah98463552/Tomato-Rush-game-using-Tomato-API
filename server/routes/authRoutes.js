/**
 * authRoutes.js - register, login, logout, "who am I".
 * Author: Utsav Sah
 *
 *   POST /api/auth/register {username, password}
 *   POST /api/auth/login    {username, password}
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 */
'use strict';

const express = require('express');
const store = require('../data/store');
const auth = require('../auth/auth');

const router = express.Router();

const publicUser = (user) => ({ id: user.id, username: user.username, createdAt: user.createdAt });

router.post('/register', async (req, res) => {
  const { username, password } = req.body || {};
  const problem = auth.validateCredentials(username, password);
  if (problem) return res.status(400).json({ error: problem });

  if (store.findUserByUsername(username)) {
    return res.status(409).json({ error: 'That username is already taken' });
  }

  const passwordHash = await auth.hashPassword(password);
  const user = store.createUser({ username, passwordHash });
  store.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
  auth.setAuthCookie(res, user);
  res.status(201).json(publicUser(user));
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  const user = typeof username === 'string' ? store.findUserByUsername(username) : null;
  const ok = user && typeof password === 'string' && (await auth.verifyPassword(password, user.passwordHash));

  if (!ok) {
    // Same message for "no such user" and "wrong password" so attackers cannot
    // find out which usernames exist (user enumeration).
    return res.status(401).json({ error: 'Wrong username or password' });
  }

  store.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
  auth.setAuthCookie(res, user);
  res.json(publicUser(user));
});

router.post('/logout', (req, res) => {
  auth.clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', auth.requireAuth, (req, res) => {
  const user = store.findUserById(req.user.id);
  if (!user) {
    auth.clearAuthCookie(res);
    return res.status(401).json({ error: 'Account no longer exists' });
  }
  res.json(publicUser(user));
});

module.exports = router;
