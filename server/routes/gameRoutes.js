/**
 * gameRoutes.js - REST endpoints for playing a game.
 * Author: Utsav Sah
 *
 *   GET  /api/game/difficulties     -> list of difficulty levels
 *   POST /api/game/start            {difficulty} -> game state
 *   POST /api/game/:id/next         -> { image, seconds, state }    (no solution!)
 *   POST /api/game/:id/answer       {answer: 0-9 | null} -> result
 *   POST /api/game/:id/quit         -> summary
 *
 * Each route is an event handler: Express calls it when a matching HTTP request arrives.
 */
'use strict';

const express = require('express');
const tomatoApi = require('../services/tomatoApi');
const { createGameService, DIFFICULTIES } = require('../services/gameService');
const { requireAuth } = require('../auth/auth');

const gameService = createGameService({ getPuzzle: tomatoApi.fetchPuzzle });

// Timer event on the server: tidy up abandoned games every 10 minutes.
setInterval(() => gameService.cleanup(), 10 * 60 * 1000).unref();

const router = express.Router();

// The logged-in user (set by requireAuth from the session cookie) owns the game.
const currentPlayer = (req) => req.user;

router.get('/difficulties', (req, res) => {
  res.json(DIFFICULTIES);
});

// Everything below needs a valid session cookie.
router.use(requireAuth);

router.post('/start', (req, res) => {
  const difficulty = (req.body && req.body.difficulty) || 'normal';
  res.status(201).json(gameService.startGame({ player: currentPlayer(req), difficulty }));
});

router.post('/:id/next', async (req, res) => {
  res.json(await gameService.nextPuzzle(req.params.id, currentPlayer(req)));
});

router.post('/:id/answer', (req, res) => {
  const raw = req.body ? req.body.answer : undefined;
  const answer = raw === null || raw === undefined ? null : Number(raw);
  res.json(gameService.submitAnswer(req.params.id, currentPlayer(req), answer));
});

router.post('/:id/quit', (req, res) => {
  res.json(gameService.quitGame(req.params.id, currentPlayer(req)));
});

module.exports = router;
