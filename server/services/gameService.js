/**
 * gameService.js - the game rules, run on the SERVER.
 * Author: Utsav Sah
 *
 * Why on the server? If score, lives and the timer only lived in the browser, a player
 * could edit them in the developer tools. Here the server:
 *   - stores the solution of the current puzzle (never sent to the browser before answering),
 *   - records when each puzzle was issued and checks the time limit itself,
 *   - calculates the points.
 * The browser only displays the state it gets back.
 *
 * Built as a factory with injected dependencies (getPuzzle, now, onGameOver) so it can be
 * unit tested without the network or a real clock (dependency injection).
 */
'use strict';

const crypto = require('crypto');

/** Difficulty settings: time per puzzle, starting lives, score multiplier. */
const DIFFICULTIES = Object.freeze({
  easy:   { label: 'Easy',   seconds: 30, lives: 3, multiplier: 1 },
  normal: { label: 'Normal', seconds: 20, lives: 3, multiplier: 2 },
  hard:   { label: 'Hard',   seconds: 10, lives: 2, multiplier: 3 },
});

const BASE_POINTS = 100;
const GRACE_MS = 1500;               // allowance for network delay
const STALE_GAME_MS = 60 * 60 * 1000; // games idle for 1 hour are removed

/** Error with an HTTP status, so routes can answer 400/403/404 correctly. */
class GameError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Points for a correct answer.
 * @param {{seconds:number, multiplier:number}} level difficulty settings
 * @param {number} elapsedMs time taken to answer
 * @param {number} streak correct answers in a row INCLUDING this one
 */
function calculatePoints(level, elapsedMs, streak) {
  const secondsLeft = Math.max(0, level.seconds - elapsedMs / 1000);
  const timeBonus = Math.round(secondsLeft * 10);
  const streakBonus = Math.min(Math.max(streak - 1, 0), 5) * 25; // max +125
  return BASE_POINTS * level.multiplier + timeBonus + streakBonus;
}

function createGameService({ getPuzzle, now = Date.now, onGameOver = () => {} }) {
  const games = new Map(); // gameId -> game object

  /** What the browser is allowed to see (no solution!). */
  function publicState(game) {
    return {
      gameId: game.id,
      difficulty: game.difficulty,
      lives: game.lives,
      maxLives: DIFFICULTIES[game.difficulty].lives,
      score: game.score,
      streak: game.streak,
      solved: game.solved,
      puzzleNumber: game.puzzleNumber,
      over: game.over,
    };
  }

  function summary(game) {
    return {
      gameId: game.id,
      userId: game.player.id,
      username: game.player.username,
      difficulty: game.difficulty,
      score: game.score,
      solved: game.solved,
      bestStreak: game.bestStreak,
      puzzles: game.puzzleNumber,
      durationSeconds: Math.round((now() - game.startedAt) / 1000),
    };
  }

  function getOwnedGame(gameId, player) {
    const game = games.get(gameId);
    if (!game) throw new GameError('Game not found', 404);
    if (game.player.id !== player.id) throw new GameError('This is not your game', 403);
    if (game.over) throw new GameError('Game is already over', 409);
    game.lastActivity = now();
    return game;
  }

  function finish(game) {
    game.over = true;
    game.current = null;
    const result = summary(game);
    onGameOver(result); // tell the rest of the system (event!) that a game finished
    return result;
  }

  return {
    /** Start a new game for a player. */
    startGame({ player, difficulty = 'normal' }) {
      if (!DIFFICULTIES[difficulty]) throw new GameError(`Unknown difficulty "${difficulty}"`);
      const level = DIFFICULTIES[difficulty];
      const game = {
        id: crypto.randomUUID(),
        player,
        difficulty,
        lives: level.lives,
        score: 0,
        streak: 0,
        bestStreak: 0,
        solved: 0,
        puzzleNumber: 0,
        current: null,
        over: false,
        startedAt: now(),
        lastActivity: now(),
      };
      games.set(game.id, game);
      return publicState(game);
    },

    /** Fetch the next puzzle and start its timer. */
    async nextPuzzle(gameId, player) {
      const game = getOwnedGame(gameId, player);
      if (game.current) throw new GameError('Answer the current puzzle first', 409);
      let puzzle;
      try {
        puzzle = await getPuzzle();
      } catch (err) {
        console.error('Puzzle provider failed:', err.message);
        throw new GameError('The puzzle service is not reachable right now. Please try again.', 502);
      }
      game.puzzleNumber += 1;
      game.current = { solution: puzzle.solution, issuedAt: now() };
      return {
        image: puzzle.image,
        source: puzzle.source,
        seconds: DIFFICULTIES[game.difficulty].seconds,
        state: publicState(game),
      };
    },

    /**
     * Check an answer. `answer === null` means the browser's timer ran out.
     * The server re-checks the time itself, so a late answer never scores.
     */
    submitAnswer(gameId, player, answer) {
      const game = getOwnedGame(gameId, player);
      if (!game.current) throw new GameError('No puzzle to answer', 409);
      if (answer !== null && !(Number.isInteger(answer) && answer >= 0 && answer <= 9)) {
        throw new GameError('Answer must be a whole number 0-9');
      }

      const level = DIFFICULTIES[game.difficulty];
      const elapsedMs = now() - game.current.issuedAt;
      const timedOut = answer === null || elapsedMs > level.seconds * 1000 + GRACE_MS;
      const solution = game.current.solution;
      const correct = !timedOut && answer === solution;
      game.current = null;

      let points = 0;
      if (correct) {
        game.streak += 1;
        game.bestStreak = Math.max(game.bestStreak, game.streak);
        game.solved += 1;
        points = calculatePoints(level, elapsedMs, game.streak);
        game.score += points;
      } else {
        game.streak = 0;
        game.lives -= 1;
      }

      const gameOver = game.lives <= 0;
      const result = { correct, timedOut, solution, points, state: publicState(game), gameOver };
      if (gameOver) {
        result.summary = finish(game);
        result.state = publicState(game);
      }
      return result;
    },

    /** Player gives up - the score so far still counts. */
    quitGame(gameId, player) {
      const game = getOwnedGame(gameId, player);
      return finish(game);
    },

    /** Remove games nobody touched for an hour (keeps memory small). */
    cleanup() {
      const cutoff = now() - STALE_GAME_MS;
      for (const [id, game] of games) {
        if (game.lastActivity < cutoff) games.delete(id);
      }
    },

    activeGameCount() {
      return games.size;
    },
  };
}

module.exports = { createGameService, calculatePoints, DIFFICULTIES, GameError, GRACE_MS };
