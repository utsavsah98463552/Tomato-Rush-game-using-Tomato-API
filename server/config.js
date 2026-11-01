/**
 * config.js - central place for all settings.
 * Author: Utsav Sah
 *
 * Values come from environment variables so that secrets are never hard-coded
 * in git (12-factor app idea, https://12factor.net/config). Defaults are only
 * for local development.
 */
'use strict';

const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const DEV_SECRET = 'dev-only-secret-change-me';

if (isProduction && !process.env.JWT_SECRET) {
  // Fail fast: never run a real deployment with the default signing key.
  throw new Error('JWT_SECRET must be set when NODE_ENV=production');
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  isProduction,
  publicDir: path.join(__dirname, '..', 'public'),

  // Interoperability: third-party Tomato API (base64=yes -> image bytes come inside the JSON)
  tomatoApiUrl: process.env.TOMATO_API_URL || 'https://marcconrad.com/uob/tomato/api.php?out=json&base64=yes',
  apiTimeoutMs: Number(process.env.API_TIMEOUT_MS) || 5000,

  // Virtual identity
  jwtSecret: process.env.JWT_SECRET || DEV_SECRET,
  sessionHours: 2,
  cookieName: 'tr_session',

  // Persistence
  dataFile: process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'db.json'),
};
