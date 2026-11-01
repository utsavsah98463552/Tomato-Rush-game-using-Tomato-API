/**
 * puzzleProvider.js - decides WHERE a puzzle comes from (resilience).
 * Author: Utsav Sah
 *
 * 1. Normally: the Tomato API (third-party web service).
 * 2. If the API fails or is slow (timeout), use a locally generated puzzle so the game
 *    keeps working - e.g. if the classroom Wi-Fi drops during the demo.
 * 3. After a failure, skip the API for 30 seconds instead of making every player wait for
 *    another timeout. This is a very small "circuit breaker" pattern.
 *
 * Reference: Circuit Breaker pattern, M. Fowler - https://martinfowler.com/bliki/CircuitBreaker.html
 */
'use strict';

const tomatoApi = require('./tomatoApi');
const { generatePuzzle } = require('./fallbackPuzzle');

const COOL_DOWN_MS = 30 * 1000;

function createPuzzleProvider({ fetchRemote = tomatoApi.fetchPuzzle, fallback = generatePuzzle, now = Date.now } = {}) {
  let apiDownUntil = 0;

  return async function getPuzzle() {
    if (now() >= apiDownUntil) {
      try {
        return await fetchRemote();
      } catch (err) {
        apiDownUntil = now() + COOL_DOWN_MS;
        console.warn(`Tomato API unavailable (${err.message}) - using offline puzzles for 30 s`);
      }
    }
    return fallback();
  };
}

module.exports = { createPuzzleProvider, COOL_DOWN_MS };
