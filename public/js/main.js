/**
 * main.js - start-up code: connects DOM events to the game.
 * Author: Utsav Sah
 *
 * EVENT SOURCES handled here:
 *   - "click" on difficulty cards, number pad, quit / play again / menu buttons
 *   - "keydown" on the whole document (keys 0-9, Escape)
 * Event delegation is used for the number pad and the difficulty cards: ONE listener on
 * the parent element handles clicks on all of its child buttons.
 */
import { api } from './api.js';
import { emit, on } from './eventBus.js';
import { GameController } from './game.js';
import * as ui from './ui.js';

const game = new GameController();
let lastDifficulty = 'normal';

/** Run an async action and turn any error into an "app:error" event. */
function safely(action) {
  return (...args) => action(...args).catch((err) => emit('app:error', err));
}

const startGame = safely(async (difficulty) => {
  lastDifficulty = difficulty;
  await game.start(difficulty);
});

const answer = safely(async (digit) => {
  ui.flashDigit(digit);
  await game.answer(digit);
});

const quit = safely(() => game.quit());

/* ---------- DOM event listeners ---------- */

document.getElementById('difficulty-grid').addEventListener('click', (event) => {
  const card = event.target.closest('[data-difficulty]');
  if (card) startGame(card.dataset.difficulty);
});

document.getElementById('numpad').addEventListener('click', (event) => {
  const button = event.target.closest('[data-digit]');
  if (button && !button.disabled) answer(Number(button.dataset.digit));
});

document.getElementById('btn-quit').addEventListener('click', quit);
document.getElementById('btn-again').addEventListener('click', () => startGame(lastDifficulty));
document.getElementById('btn-menu').addEventListener('click', () => ui.showScreen('menu'));

document.addEventListener('keydown', (event) => {
  if (!game.active) return;
  if (/^[0-9]$/.test(event.key)) answer(Number(event.key));
  if (event.key === 'Escape') quit();
});

on('game:over', () => { /* week 6: refresh leaderboard here */ });

/* ---------- start-up ---------- */

safely(async () => {
  ui.renderNumpad();
  ui.renderDifficulties(await api.get('/api/game/difficulties'));
  ui.showScreen('menu');
})();
