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

module.exports = {
  port: Number(process.env.PORT) || 3000,
  isProduction: process.env.NODE_ENV === 'production',
  publicDir: path.join(__dirname, '..', 'public'),
};
