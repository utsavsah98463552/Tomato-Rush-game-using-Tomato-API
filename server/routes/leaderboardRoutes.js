/**
 * leaderboardRoutes.js - high scores and personal statistics.
 * Author: Utsav Sah
 *
 *   GET /api/leaderboard?difficulty=all|easy|normal|hard   -> top 10 (best per player)
 *   GET /api/leaderboard/me                               -> my statistics (login required)
 */
'use strict';

const express = require('express');
const store = require('../data/store');
const { requireAuth } = require('../auth/auth');
const { DIFFICULTIES } = require('../services/gameService');

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

module.exports = router;
