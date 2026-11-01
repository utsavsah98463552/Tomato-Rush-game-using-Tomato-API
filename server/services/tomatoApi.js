/**
 * tomatoApi.js - client for Marc Conrad's Tomato API (INTEROPERABILITY).
 * Author: Utsav Sah
 *
 * The Tomato API is a third-party web service written in PHP and running on a
 * different server. My Node.js code talks to it using:
 *   - Protocol: HTTPS, method GET
 *   - Data format: JSON  { "question": <image URL or base64 PNG>, "solution": <0-9> }
 * Neither side needs to know what language the other is written in - they only
 * agree on HTTP + JSON. That is the interoperability point for the video.
 *
 * References:
 *  - Tomato API by Marc Conrad: https://marcconrad.com/uob/tomato/api.php
 *  - Query options (out=json|csv, base64=yes|no) and base64 decoding idea taken from
 *    the unit example GameServer.java: https://github.com/marcconrad/comparativeintegratedsystems
 *  - fetch() + AbortController timeout pattern:
 *    https://developer.mozilla.org/en-US/docs/Web/API/AbortController
 */
'use strict';

const config = require('../config');

/**
 * Turn the raw API response into the shape used by my game.
 * Kept separate (pure function) so it can be unit tested without the network.
 * @param {{question: string, solution: number|string}} data
 * @returns {{image: string, solution: number, source: string}}
 */
function normaliseResponse(data) {
  if (!data || typeof data.question !== 'string' || data.question.length === 0) {
    throw new Error('Tomato API: missing "question" field');
  }
  const solution = Number(data.solution);
  if (!Number.isInteger(solution) || solution < 0 || solution > 9) {
    throw new Error(`Tomato API: unexpected solution "${data.solution}"`);
  }

  // With base64=no the API sends an image URL, with base64=yes it sends the PNG bytes.
  const image = /^https?:\/\//.test(data.question)
    ? data.question
    : `data:image/png;base64,${data.question}`;

  return { image, solution, source: 'tomato-api' };
}

/**
 * Fetch one new puzzle from the Tomato API.
 * @returns {Promise<{image: string, solution: number, source: string}>}
 */
async function fetchPuzzle() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.apiTimeoutMs);

  try {
    const response = await fetch(config.tomatoApiUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Tomato API: HTTP ${response.status}`);
    }
    // Read as text first: the PHP API does not always send a JSON content-type header.
    const text = await response.text();
    return normaliseResponse(JSON.parse(text));
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchPuzzle, normaliseResponse };
