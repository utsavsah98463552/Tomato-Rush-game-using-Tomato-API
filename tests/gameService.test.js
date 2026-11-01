/**
 * Unit tests for the game rules. A fake clock and fake puzzle source are injected, so
 * the tests are fast and do not need the network.
 * Run with: npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createGameService, calculatePoints, DIFFICULTIES, GRACE_MS } = require('../server/services/gameService');

function setup() {
  let time = 1_000_000;
  const finished = [];
  const service = createGameService({
    getPuzzle: async () => ({ image: 'data:image/png;base64,AAA', solution: 7, source: 'test' }),
    now: () => time,
    onGameOver: (summary) => finished.push(summary),
  });
  const player = { id: 'u1', username: 'alice' };
  return { service, player, finished, advance: (ms) => { time += ms; } };
}

test('correct answer scores points and builds a streak', async () => {
  const { service, player, advance } = setup();
  const { gameId } = service.startGame({ player, difficulty: 'normal' });

  await service.nextPuzzle(gameId, player);
  advance(5000);
  const r1 = service.submitAnswer(gameId, player, 7);
  assert.equal(r1.correct, true);
  assert.equal(r1.points, calculatePoints(DIFFICULTIES.normal, 5000, 1));
  assert.equal(r1.state.streak, 1);

  await service.nextPuzzle(gameId, player);
  const r2 = service.submitAnswer(gameId, player, 7);
  assert.equal(r2.state.streak, 2);
  assert.ok(r2.points > r1.points, 'faster answer + streak bonus should give more points');
});

test('the solution is never part of the puzzle sent to the browser', async () => {
  const { service, player } = setup();
  const { gameId } = service.startGame({ player });
  const puzzle = await service.nextPuzzle(gameId, player);
  assert.equal(JSON.stringify(puzzle).includes('"solution"'), false);
});

test('wrong answer costs a life and resets the streak', async () => {
  const { service, player } = setup();
  const { gameId } = service.startGame({ player, difficulty: 'easy' });
  await service.nextPuzzle(gameId, player);
  const r = service.submitAnswer(gameId, player, 3);
  assert.equal(r.correct, false);
  assert.equal(r.solution, 7);
  assert.equal(r.state.lives, DIFFICULTIES.easy.lives - 1);
  assert.equal(r.state.streak, 0);
});

test('a correct answer that arrives too late counts as a time-out', async () => {
  const { service, player, advance } = setup();
  const { gameId } = service.startGame({ player, difficulty: 'hard' });
  await service.nextPuzzle(gameId, player);
  advance(DIFFICULTIES.hard.seconds * 1000 + GRACE_MS + 1);
  const r = service.submitAnswer(gameId, player, 7);
  assert.equal(r.correct, false);
  assert.equal(r.timedOut, true);
});

test('losing all lives ends the game and fires onGameOver once', async () => {
  const { service, player, finished } = setup();
  const { gameId } = service.startGame({ player, difficulty: 'hard' }); // 2 lives
  for (let i = 0; i < DIFFICULTIES.hard.lives; i++) {
    await service.nextPuzzle(gameId, player);
    service.submitAnswer(gameId, player, null);
  }
  assert.equal(finished.length, 1);
  assert.equal(finished[0].username, 'alice');
  await assert.rejects(() => service.nextPuzzle(gameId, player), { status: 409 });
});

test('another user cannot play my game', async () => {
  const { service, player } = setup();
  const { gameId } = service.startGame({ player });
  await assert.rejects(() => service.nextPuzzle(gameId, { id: 'u2', username: 'mallory' }), { status: 403 });
});

test('invalid answers and difficulties are rejected', async () => {
  const { service, player } = setup();
  assert.throws(() => service.startGame({ player, difficulty: 'impossible' }), { status: 400 });
  const { gameId } = service.startGame({ player });
  await service.nextPuzzle(gameId, player);
  assert.throws(() => service.submitAnswer(gameId, player, 12), { status: 400 });
});
