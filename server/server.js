/**
 * server.js - entry point of the Tomato Rush back end.
 * Author: Utsav Sah
 *
 * Builds the Express application and starts listening for HTTP requests.
 * Every incoming request is an *event*; Express calls the matching handler.
 *
 * References:
 *  - Express "Hello world" / static files guide: https://expressjs.com/en/starter/static-files.html
 */
'use strict';

const express = require('express');
const config = require('./config');
const gameRoutes = require('./routes/gameRoutes');

/** Create and configure the Express app (exported so tests can use it). */
function createApp() {
  const app = express();

  app.use(express.json({ limit: '10kb' }));      // parse JSON request bodies
  app.use(express.static(config.publicDir));      // serve the front end

  app.use('/api/game', gameRoutes);               // puzzle + answer endpoints

  // Simple health check - useful to prove the server is up during the demo.
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
  });

  return app;
}

// Only start listening when run directly (`node server/server.js`), not when required by tests.
if (require.main === module) {
  createApp().listen(config.port, () => {
    console.log(`Tomato Rush running on http://localhost:${config.port}`);
  });
}

module.exports = { createApp };
