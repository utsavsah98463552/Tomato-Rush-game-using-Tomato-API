/**
 * leaderboardRoutes.js - high scores and personal statistics.
 * Author: Utsav Sah
 *
 *   GET /api/leaderboard?difficulty=all|easy|normal|hard   -> top 10 (best per player)
 *   GET /api/leaderboard/me                               -> my statistics (login required)
 *   GET /api/leaderboard/stream                           -> live updates (Server-Sent Events)
 *
 * Server-Sent Events (SSE): the browser opens ONE long-lived HTTP connection and the server
 * pushes a message down it whenever the "score:saved" event fires. The browser's
 * EventSource object turns each message into a JavaScript event. No polling needed.
 * Reference: MDN, Using server-sent events
 *   https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
 */
'use strict';

const express = require('express');
const store = require('../data/store');
const { requireAuth } = require('../auth/auth');
const { DIFFICULTIES } = require('../services/gameService');
const gameEvents = require('../events/gameEvents');

const HEARTBEAT_MS = 25 * 1000;

const router = express.Router();

function parseDifficulty(value) {
  return value && DIFFICULTIES[value] ? value : 'all';
}

router.get('/', (req, res) => {
  res.json(store.topScores({ difficulty: parseDifficulty(req.query.difficulty) }));
});

router.get('/me', requireAuth, (req, res) => {
  res.json(store.userStats(req.user.id));
});

router.get('/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write('retry: 3000\n\n'); // browser reconnects after 3 s if the connection drops

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  // Event handler: called every time ANY player's score is saved.
  const onScoreSaved = (entry) => send('score', {
    username: entry.username,
    score: entry.score,
    difficulty: entry.difficulty,
  });
  gameEvents.on('score:saved', onScoreSaved);

  // Comment line every 25 s keeps proxies from closing an idle connection.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);

  send('hello', { connected: true });

  // "close" event: browser tab closed -> stop listening, otherwise we leak listeners.
  req.on('close', () => {
    clearInterval(heartbeat);
    gameEvents.off('score:saved', onScoreSaved);
  });
});

module.exports = router;
