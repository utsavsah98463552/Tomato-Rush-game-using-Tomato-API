/**
 * Tests for the interoperability layer: parsing Tomato API responses, the offline
 * fallback puzzles and the "circuit breaker" in the puzzle provider.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normaliseResponse } = require('../server/services/tomatoApi');
const { makeEquation, generatePuzzle } = require('../server/services/fallbackPuzzle');
const { createPuzzleProvider, COOL_DOWN_MS } = require('../server/services/puzzleProvider');

test('Tomato API response with an image URL', () => {
  const p = normaliseResponse({ question: 'https://marcconrad.com/uob/tomato/images/x.png', solution: '4' });
  assert.deepEqual(p, { image: 'https://marcconrad.com/uob/tomato/images/x.png', solution: 4, source: 'tomato-api' });
});

test('Tomato API response with base64 image data', () => {
  const p = normaliseResponse({ question: 'iVBORw0KGgo=', solution: 0 });
  assert.equal(p.image, 'data:image/png;base64,iVBORw0KGgo=');
  assert.equal(p.solution, 0);
});

test('malformed Tomato API responses are rejected', () => {
  assert.throws(() => normaliseResponse({}));
  assert.throws(() => normaliseResponse({ question: 'x', solution: 15 }));
  assert.throws(() => normaliseResponse({ question: 'x', solution: 'abc' }));
});

test('offline puzzles always have exactly one correct digit', () => {
  for (let i = 0; i < 2000; i++) {
    const eq = makeEquation();
    const fits = [];
    for (let d = 0; d <= 9; d++) {
      const a = eq.hide === 'a' ? d : eq.a;
      const b = eq.hide === 'b' ? d : eq.b;
      const r = eq.op === '+' ? a + b : eq.op === '−' ? a - b : a * b;
      if (r === eq.result) fits.push(d);
    }
    assert.equal(fits.length, 1, `ambiguous puzzle: ${JSON.stringify(eq)}`);
  }
});

test('offline puzzle is an SVG data URL', () => {
  const p = generatePuzzle();
  assert.match(p.image, /^data:image\/svg\+xml;base64,/);
  assert.equal(p.source, 'offline');
});

test('provider falls back when the API fails, then waits before retrying', async () => {
  let time = 0;
  let calls = 0;
  const getPuzzle = createPuzzleProvider({
    fetchRemote: async () => { calls += 1; throw new Error('network down'); },
    fallback: () => ({ image: 'x', solution: 1, source: 'offline' }),
    now: () => time,
  });

  assert.equal((await getPuzzle()).source, 'offline');
  assert.equal(calls, 1);
  await getPuzzle();                // within cool-down: API not called again
  assert.equal(calls, 1);
  time += COOL_DOWN_MS;
  await getPuzzle();                // cool-down over: API tried again
  assert.equal(calls, 2);
});
