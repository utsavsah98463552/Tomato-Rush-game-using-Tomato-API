/**
 * auth.js (browser) - login, register, logout and the "remember me" cookie.
 * Author: Utsav Sah
 *
 * Two kinds of cookie are used in this app - a nice contrast for the video:
 *   1. tr_session   - set by the SERVER, HttpOnly. Holds the signed JWT. This page's
 *                     JavaScript cannot read it at all (document.cookie does not show it).
 *   2. tr_last_user - set HERE by JavaScript. Only remembers the username to pre-fill
 *                     the login form. Not secret, so it is fine for JS to read it.
 *
 * Reference: MDN document.cookie - https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
 */
import { api } from './api.js';
import { emit } from './eventBus.js';

const REMEMBER_COOKIE = 'tr_last_user';
const REMEMBER_DAYS = 30;

export let currentUser = null;

function setUser(user) {
  currentUser = user;
  emit('auth:changed', user); // UI listens and switches screens
}

/** Ask the server who we are (the browser sends the session cookie automatically). */
export async function restoreSession() {
  try {
    setUser(await api.get('/api/auth/me'));
  } catch (err) {
    if (err.status !== 401) throw err;
    setUser(null);
  }
}

export async function login(username, password) {
  const user = await api.post('/api/auth/login', { username, password });
  setUser(user);
  return user; // includes previousLogin {at, ip}
}

export async function register(username, password) {
  setUser(await api.post('/api/auth/register', { username, password }));
}

export async function logout() {
  await api.post('/api/auth/logout');
  setUser(null);
}

/* ---------- readable "remember my username" cookie ---------- */

export function rememberUsername(username) {
  const maxAge = REMEMBER_DAYS * 24 * 60 * 60;
  document.cookie = `${REMEMBER_COOKIE}=${encodeURIComponent(username)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

export function forgetUsername() {
  document.cookie = `${REMEMBER_COOKIE}=; max-age=0; path=/`;
}

export function rememberedUsername() {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${REMEMBER_COOKIE}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : '';
}
