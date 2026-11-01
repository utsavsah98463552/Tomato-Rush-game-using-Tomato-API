/**
 * gameRoutes.js - REST endpoints for the game (Week 3 version).
 * Author: Utsav Sah
 *
 *   GET  /api/game/puzzle            -> { puzzleId, image }   (solution stays on the server!)
 *   POST /api/game/answer {puzzleId, answer} -> { correct, solution }
 */
'use strict';

const crypto = require('crypto');
const express = require('express');
const tomatoApi = require('../services/tomatoApi');

const router = express.Router();
const openPuzzles = new Map(); // puzzleId -> solution

router.get('/puzzle', async (req, res) => {
  try {
    const puzzle = await tomatoApi.fetchPuzzle();
    const puzzleId = crypto.randomUUID();
    openPuzzles.set(puzzleId, puzzle.solution);
    res.json({ puzzleId, image: puzzle.image });
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: 'Could not reach the Tomato API' });
  }
});

router.post('/answer', (req, res) => {
  const { puzzleId, answer } = req.body || {};
  if (!openPuzzles.has(puzzleId)) {
    return res.status(404).json({ error: 'Unknown puzzle' });
  }
  const solution = openPuzzles.get(puzzleId);
  openPuzzles.delete(puzzleId); // each puzzle can only be answered once
  res.json({ correct: Number(answer) === solution, solution });
});

module.exports = router;
