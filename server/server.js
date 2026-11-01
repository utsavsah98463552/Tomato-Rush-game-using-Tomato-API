/**
 * server.js - entry point of the Tomato Rush back end.
 * Author: Utsav Sah
 *
 * Builds the Express application and starts listening for HTTP requests.
 * Every incoming request is an *event*; Express calls the matching handler.
 *
 * References:
 *  - Express "Hello world" / static files guide: https://expressjs.com/en/starter/static-files.html
 *  - Express error handling: https://expressjs.com/en/guide/error-handling.html
 */
'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const { registerHandlers } = require('./events/handlers');

/** Create and configure the Express app (exported so tests can use it). */
function createApp() {
  const app = express();
  registerHandlers(); // subscribe to server-side game events (saving scores, ...)

  app.use(express.json({ limit: '10kb' }));      // parse JSON request bodies
  app.use(cookieParser());                        // read cookies into req.cookies
  app.use(express.static(config.publicDir));      // serve the front end

  app.use('/api/auth', authRoutes);               // register / login / logout
  app.use('/api/game', gameRoutes);               // game endpoints (login required)
  app.use('/api/leaderboard', leaderboardRoutes); // high scores + personal stats

  // Simple health check - useful to prove the server is up during the demo.
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
  });

  // Unknown API route
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // Central error handler: Express 5 forwards errors thrown in async handlers here.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (!err.status) console.error(err);
    // Only show our own error messages; hide internal details of unexpected errors.
    res.status(status).json({ error: err.status ? err.message : 'Something went wrong on the server' });
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
