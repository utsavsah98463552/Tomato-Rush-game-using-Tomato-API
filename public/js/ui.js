/**
 * ui.js - everything that changes what the player sees.
 * Author: Utsav Sah
 *
 * The UI does not run the game. It LISTENS to events on the event bus
 * (game:started, puzzle:loaded, timer:tick, answer:result, game:over ...) and updates
 * the page. This keeps display code separate from game logic.
 */
import { on } from './eventBus.js';

const $ = (id) => document.getElementById(id);

let toastTimer = null;

export function showScreen(name) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.add('hidden'));
  $(`screen-${name}`).classList.remove('hidden');
}

export function toast(message, ms = 3500) {
  const el = $('toast');
  el.textContent = message;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), ms); // timeout event
}

/** Escape text before putting it into innerHTML (defence against XSS). */
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const shortDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** Personal statistics panel on the menu. */
export function renderStats(stats) {
  $('stat-games').textContent = stats.gamesPlayed;
  $('stat-best').textContent = stats.bestScore;
  $('stat-avg').textContent = stats.averageScore;
  $('stat-solved').textContent = stats.totalSolved;
  $('recent-games').innerHTML = stats.recent.length
    ? stats.recent.map((g) => `
        <li><span>${g.score} pts <span class="tag">${escapeHtml(g.difficulty)}</span></span>
            <span class="muted">${g.solved} solved · ${shortDate(g.playedAt)}</span></li>`).join('')
    : '<li class="empty">No games yet – pick a difficulty above!</li>';
}

/**
 * Leaderboard panel.
 * @param {Array} entries rows from GET /api/leaderboard
 * @param {string} me current username (highlighted)
 * @param {string} [flashName] username whose row should flash (new score just arrived)
 */
export function renderLeaderboard(entries, me, flashName) {
  $('leaderboard').innerHTML = entries.length
    ? entries.map((e) => `
        <li class="${e.username === me ? 'me' : ''} ${e.username === flashName ? 'flash' : ''}">
          <span class="rank">${e.rank}</span>
          <span class="who">${escapeHtml(e.username)} <span class="tag">${escapeHtml(e.difficulty)}</span></span>
          <b>${e.score}</b>
        </li>`).join('')
    : '<li class="empty">No scores yet – be the first!</li>';
}

export function showPersonalBest(isBest) {
  $('over-best').classList.toggle('hidden', !isBest);
}

/** Build the difficulty cards from the server's settings. */
export function renderDifficulties(levels) {
  $('difficulty-grid').innerHTML = Object.entries(levels).map(([key, l]) => `
    <button class="difficulty" data-difficulty="${key}">
      <h3>${l.label}</h3>
      <ul>
        <li>⏱ ${l.seconds} seconds per puzzle</li>
        <li>❤️ ${l.lives} lives</li>
        <li>⭐ ×${l.multiplier} score multiplier</li>
      </ul>
    </button>`).join('');
}

/** Create the 0-9 number pad. */
export function renderNumpad() {
  $('numpad').innerHTML = Array.from({ length: 10 }, (_, d) =>
    `<button data-digit="${d}" aria-label="answer ${d}">${d}</button>`).join('');
}

function setNumpadEnabled(enabled) {
  $('numpad').querySelectorAll('button').forEach((b) => { b.disabled = !enabled; });
}

function renderHud(state) {
  $('hud-score').textContent = state.score;
  $('hud-number').textContent = Math.max(state.puzzleNumber, 1);
  $('hud-streak').textContent = state.streak;
  $('hud-lives').textContent = '❤️'.repeat(Math.max(state.lives, 0)) + '🤍'.repeat(state.maxLives - Math.max(state.lives, 0));
}

function setFeedback(text, kind = '') {
  const el = $('feedback');
  el.textContent = text;
  el.className = `feedback ${kind}`;
}

/** Briefly highlight a pressed digit (visual feedback for click AND keyboard). */
export function flashDigit(digit) {
  const btn = $('numpad').querySelector(`[data-digit="${digit}"]`);
  if (!btn) return;
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 200);
}

/* ---------- event subscriptions ---------- */

on('game:started', (state) => {
  renderHud(state);
  setFeedback('');
  showScreen('game');
});

on('puzzle:loading', () => {
  setNumpadEnabled(false);
  $('puzzle-loading').classList.remove('hidden');
});

on('puzzle:loaded', (puzzle) => {
  $('puzzle-img').src = puzzle.image;
  $('puzzle-source').textContent = puzzle.source === 'tomato-api' ? 'via Tomato API' : 'offline puzzle';
  $('puzzle-loading').classList.add('hidden');
  renderHud(puzzle.state);
  setFeedback('');
  setNumpadEnabled(true);
});

on('timer:tick', ({ msLeft, fraction }) => {
  const fill = $('timer-fill');
  fill.style.width = `${fraction * 100}%`;
  fill.classList.toggle('warn', fraction < 0.5 && fraction >= 0.2);
  fill.classList.toggle('danger', fraction < 0.2);
  fill.title = `${Math.ceil(msLeft / 1000)} s left`;
});

on('puzzle:timeout', () => setNumpadEnabled(false));

on('answer:result', (result) => {
  setNumpadEnabled(false);
  renderHud(result.state);
  if (result.correct) {
    setFeedback(`✅ Correct! +${result.points} points`, 'good');
  } else if (result.timedOut) {
    setFeedback(`⏰ Time's up! It was ${result.solution}`, 'bad');
  } else {
    setFeedback(`❌ Not ${result.given} – it was ${result.solution}`, 'bad');
  }
});

on('game:over', (summary) => {
  $('over-score').textContent = summary.score;
  $('over-solved').textContent = summary.solved;
  $('over-streak').textContent = summary.bestStreak;
  $('over-difficulty').textContent = summary.difficulty;
  setTimeout(() => showScreen('over'), 900);
});

on('app:error', (err) => toast(`⚠️ ${err.message}`));
