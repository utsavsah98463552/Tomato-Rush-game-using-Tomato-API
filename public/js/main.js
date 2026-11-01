/**
 * main.js - start-up code: connects DOM events to the game.
 * Author: Utsav Sah
 *
 * EVENT SOURCES handled here:
 *   - "submit" of the login/register form, "click" on the tabs
 *   - "click" on difficulty cards, number pad, quit / play again / menu / logout buttons
 *   - "keydown" on the whole document (keys 0-9, Escape)
 *   - custom bus events: auth:changed, app:error
 * Event delegation is used for the number pad and the difficulty cards: ONE listener on
 * the parent element handles clicks on all of its child buttons.
 */
import { api } from './api.js';
import { emit, on } from './eventBus.js';
import { GameController } from './game.js';
import * as auth from './auth.js';
import * as ui from './ui.js';
import { connectLive, disconnectLive } from './live.js';

const game = new GameController();
let lastDifficulty = 'normal';
let bestBeforeGame = 0; // to detect a new personal best
let authMode = 'login'; // or 'register'

/** Run an async action and turn any error into an "app:error" event. */
function safely(action) {
  return (...args) => action(...args).catch((err) => emit('app:error', err));
}

const $ = (id) => document.getElementById(id);

/* ---------- authentication ---------- */

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === mode));
  $('auth-submit').textContent = mode === 'login' ? 'Log in' : 'Create account';
  $('auth-password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('auth-hint').classList.toggle('hidden', mode === 'login');
  $('auth-error').textContent = '';
}

document.querySelector('.tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]');
  if (tab) setAuthMode(tab.dataset.tab);
});

$('auth-form').addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the browser from reloading the page
  const username = $('auth-username').value.trim();
  const password = $('auth-password').value;
  $('auth-error').textContent = '';
  $('auth-submit').disabled = true;
  try {
    if (authMode === 'login') {
      const user = await auth.login(username, password);
      if (user.previousLogin) {
        const when = new Date(user.previousLogin.at).toLocaleString();
        ui.toast(`👋 Welcome back! Last login: ${when} from IP ${user.previousLogin.ip}`, 6000);
      }
    } else {
      await auth.register(username, password);
    }
    if ($('auth-remember').checked) auth.rememberUsername(username);
    else auth.forgetUsername();
    $('auth-password').value = '';
  } catch (err) {
    $('auth-error').textContent = err.message;
  } finally {
    $('auth-submit').disabled = false;
  }
});

$('btn-logout').addEventListener('click', safely(async () => {
  if (game.active) await game.quit();
  await auth.logout();
}));

on('auth:changed', (user) => {
  $('user-chip').classList.toggle('hidden', !user);
  if (user) {
    $('user-name').textContent = user.username;
    ui.showScreen('menu');
    refreshMenuData();
    connectLive();
  } else {
    const remembered = auth.rememberedUsername();
    $('auth-username').value = remembered;
    $('auth-remember').checked = Boolean(remembered);
    disconnectLive();
    setAuthMode('login'); // returning players usually want to log in, not register
    ui.showScreen('auth');
  }
});

// If the session cookie expires during play, the server answers 401 -> back to login.
on('app:error', (err) => {
  if (err.status === 401 && auth.currentUser) {
    game.active = false;
    game.stopTimer();
    auth.restoreSession();
  }
});

/* ---------- leaderboard & stats ---------- */

const refreshLeaderboard = safely(async (flashName) => {
  const difficulty = $('board-filter').value;
  const entries = await api.get(`/api/leaderboard?difficulty=${encodeURIComponent(difficulty)}`);
  ui.renderLeaderboard(entries, auth.currentUser && auth.currentUser.username, flashName);
});

const refreshStats = safely(async () => {
  const stats = await api.get('/api/leaderboard/me');
  bestBeforeGame = stats.bestScore;
  ui.renderStats(stats);
});

function refreshMenuData() {
  refreshStats();
  refreshLeaderboard();
}

$('board-filter').addEventListener('change', () => refreshLeaderboard()); // "change" event

on('game:over', (summary) => {
  ui.showPersonalBest(summary.score > 0 && summary.score > bestBeforeGame);
  refreshStats(); // the leaderboard itself is refreshed by the live "score" event below
});

// Pushed by the server (Server-Sent Events) whenever ANY player's score is saved.
on('leaderboard:score', (entry) => {
  refreshLeaderboard(entry.username);
  const me = auth.currentUser && auth.currentUser.username;
  if (entry.username !== me && !game.active) {
    ui.toast(`🎉 ${entry.username} just scored ${entry.score} on ${entry.difficulty}!`);
  }
});

on('live:status', (connected) => $('live-badge').classList.toggle('hidden', !connected));

/* ---------- game ---------- */

const startGame = safely(async (difficulty) => {
  lastDifficulty = difficulty;
  await game.start(difficulty);
});

const answer = safely(async (digit) => {
  ui.flashDigit(digit);
  await game.answer(digit);
});

const quit = safely(() => game.quit());

$('difficulty-grid').addEventListener('click', (event) => {
  const card = event.target.closest('[data-difficulty]');
  if (card) startGame(card.dataset.difficulty);
});

$('numpad').addEventListener('click', (event) => {
  const button = event.target.closest('[data-digit]');
  if (button && !button.disabled) answer(Number(button.dataset.digit));
});

$('btn-quit').addEventListener('click', quit);
$('btn-again').addEventListener('click', () => startGame(lastDifficulty));
$('btn-menu').addEventListener('click', () => ui.showScreen('menu'));

document.addEventListener('keydown', (event) => {
  if (!game.active) return;
  if (/^[0-9]$/.test(event.key)) answer(Number(event.key));
  if (event.key === 'Escape') quit();
});

/* ---------- start-up ---------- */

safely(async () => {
  ui.renderNumpad();
  ui.renderDifficulties(await api.get('/api/game/difficulties'));
  await auth.restoreSession(); // fires auth:changed -> menu or login screen
})();
