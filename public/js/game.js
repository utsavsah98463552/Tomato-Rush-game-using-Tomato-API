/**
 * game.js - GameController: runs one game in the browser.
 * Author: Utsav Sah
 *
 * Event flow for one round:
 *   loadNext()  -> emits "puzzle:loading", then "puzzle:loaded"
 *   timer       -> setInterval emits "timer:tick" every 100 ms
 *               -> on 0 emits "puzzle:timeout" and sends answer = null
 *   answer(d)   -> server checks it -> emits "answer:result"
 *               -> either loads the next puzzle or emits "game:over"
 *
 * The browser timer is only for display - the server checks the real time limit.
 */
import { api } from './api.js';
import { emit } from './eventBus.js';

const NEXT_PUZZLE_DELAY_MS = 1200; // time to show "Correct!" / "Wrong" before the next puzzle
const TICK_MS = 100;

export class GameController {
  constructor() {
    this.state = null;      // public game state from the server
    this.active = false;    // is a game running?
    this.accepting = false; // can the player answer right now?
    this.timerId = null;
  }

  async start(difficulty) {
    this.state = await api.post('/api/game/start', { difficulty });
    this.active = true;
    emit('game:started', this.state);
    await this.loadNext();
  }

  async loadNext() {
    if (!this.active) return;
    this.accepting = false;
    emit('puzzle:loading');
    let puzzle;
    try {
      puzzle = await api.post(`/api/game/${this.state.gameId}/next`);
    } catch (err) {
      if (!this.active) return; // player quit while we were waiting - not an error
      throw err;
    }
    if (!this.active) return;
    this.state = puzzle.state;
    emit('puzzle:loaded', puzzle);
    this.startTimer(puzzle.seconds);
    this.accepting = true;
  }

  startTimer(seconds) {
    this.stopTimer();
    const total = seconds * 1000;
    const deadline = performance.now() + total;

    this.timerId = setInterval(() => {
      const msLeft = Math.max(0, deadline - performance.now());
      emit('timer:tick', { msLeft, fraction: msLeft / total });
      if (msLeft === 0) {
        this.stopTimer();
        emit('puzzle:timeout');
        this.answer(null); // tell the server the time ran out
      }
    }, TICK_MS);
  }

  stopTimer() {
    clearInterval(this.timerId);
    this.timerId = null;
  }

  /** @param {number|null} digit 0-9, or null when the time ran out */
  async answer(digit) {
    if (!this.active || !this.accepting) return; // ignore double clicks / late key presses
    this.accepting = false;
    this.stopTimer();

    const result = await api.post(`/api/game/${this.state.gameId}/answer`, { answer: digit });
    this.state = result.state;
    emit('answer:result', { ...result, given: digit });

    if (result.gameOver) {
      this.active = false;
      emit('game:over', result.summary);
    } else {
      setTimeout(() => this.loadNext().catch((err) => emit('app:error', err)), NEXT_PUZZLE_DELAY_MS);
    }
  }

  async quit() {
    if (!this.active) return;
    this.active = false;
    this.accepting = false;
    this.stopTimer();
    const summary = await api.post(`/api/game/${this.state.gameId}/quit`);
    emit('game:over', summary);
  }
}
