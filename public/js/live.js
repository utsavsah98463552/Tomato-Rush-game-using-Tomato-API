/**
 * live.js - live leaderboard using Server-Sent Events (EventSource).
 * Author: Utsav Sah
 *
 * The server PUSHES a "score" event whenever any player finishes a game. The browser's
 * EventSource turns that into a JavaScript event, which we forward onto our event bus
 * as "leaderboard:score". EventSource reconnects by itself if the connection drops.
 *
 * Reference: MDN EventSource - https://developer.mozilla.org/en-US/docs/Web/API/EventSource
 */
import { emit } from './eventBus.js';

let source = null;

export function connectLive() {
  if (source) return;
  source = new EventSource('/api/leaderboard/stream');

  source.addEventListener('hello', () => emit('live:status', true));
  source.addEventListener('score', (event) => emit('leaderboard:score', JSON.parse(event.data)));
  source.addEventListener('error', () => emit('live:status', false)); // will retry automatically
}

export function disconnectLive() {
  if (!source) return;
  source.close();
  source = null;
  emit('live:status', false);
}
