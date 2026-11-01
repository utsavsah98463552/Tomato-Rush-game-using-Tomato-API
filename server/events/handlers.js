/**
 * handlers.js - event handlers that react to game events on the server.
 * Author: Utsav Sah
 */
'use strict';

const gameEvents = require('./gameEvents');
const store = require('../data/store');

function registerHandlers() {
  gameEvents.on('game:finished', (summary) => {
    console.log(`[event] game:finished ${summary.username} scored ${summary.score} (${summary.difficulty})`);

    // A game where no puzzle was even shown is not worth a leaderboard entry.
    if (summary.puzzles === 0) return;

    const saved = store.addScore(summary);
    gameEvents.emit('score:saved', saved);
  });
}

module.exports = { registerHandlers };
