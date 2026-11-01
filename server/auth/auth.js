/**
 * auth.js - VIRTUAL IDENTITY: passwords, tokens and cookies.
 * Author: Utsav Sah
 *
 * How a player proves who they are:
 *   1. Register/login with username + password.
 *   2. The password is checked against a bcrypt HASH (salted, slow on purpose, so a
 *      stolen data file does not reveal passwords).
 *   3. The server creates a JSON Web Token (JWT) signed with a secret key. It contains
 *      the user id and name and expires after 2 hours.
 *   4. The JWT is sent back in a cookie with these flags:
 *        HttpOnly  - JavaScript in the page cannot read it (protects against XSS theft)
 *        SameSite  - not sent on requests from other sites (protects against CSRF)
 *        Secure    - HTTPS only (switched on in production)
 *   5. On every request the browser sends the cookie back; requireAuth() checks the
 *      signature and expiry and puts the user on req.user.
 *
 * References:
 *  - bcryptjs: https://www.npmjs.com/package/bcryptjs
 *  - jsonwebtoken: https://www.npmjs.com/package/jsonwebtoken
 *  - OWASP Session Management Cheat Sheet:
 *    https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
 *  - OWASP Password Storage Cheat Sheet:
 *    https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 */
'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const SALT_ROUNDS = 10;
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const MIN_PASSWORD_LENGTH = 8;

/** @returns {string|null} an error message, or null if the input is acceptable */
function validateCredentials(username, password) {
  if (typeof username !== 'string' || !USERNAME_PATTERN.test(username)) {
    return 'Username must be 3-20 characters: letters, numbers or _';
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > 72) {
    return 'Password is too long (max 72 characters)'; // bcrypt only uses the first 72 bytes
  }
  return null;
}

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);
const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: `${config.sessionHours}h` },
  );
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.isProduction,
    path: '/',
  };
}

function setAuthCookie(res, user) {
  res.cookie(config.cookieName, issueToken(user), {
    ...cookieOptions(),
    maxAge: config.sessionHours * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(config.cookieName, cookieOptions());
}

/** Read and verify the token cookie. Returns {id, username} or null. */
function userFromRequest(req) {
  const token = req.cookies && req.cookies[config.cookieName];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return { id: payload.sub, username: payload.username };
  } catch {
    return null; // expired, tampered with, or signed with another key
  }
}

/** Express middleware: only logged-in users may continue. */
function requireAuth(req, res, next) {
  const user = userFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Please log in first' });
  }
  req.user = user;
  next();
}

module.exports = {
  validateCredentials,
  hashPassword,
  verifyPassword,
  setAuthCookie,
  clearAuthCookie,
  userFromRequest,
  requireAuth,
};
