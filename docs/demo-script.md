# Week 8 Demo Script (≈ 5 minutes)

## Before the session
- [ ] `npm install` done, `npm start` running, browser open at http://localhost:3000
- [ ] Two browser windows ready (one normal, one private/incognito) for the live leaderboard
- [ ] Code editor open on the files listed below
- [ ] Terminal ready for `git log --graph --oneline --all` and `npm test`
- [ ] Printed + filled progress form (see `week8-progress-form.md`)
- [ ] If the Wi-Fi is down the game still works (offline puzzles) – mention it as a feature

## 1. Show it working (≈ 1.5 min)
1. Register a new user → menu with stats + leaderboard (● live badge).
2. Play **Normal**: answer with mouse, then with keyboard; let one time out.
3. Game over → score, "New personal best!".
4. In the private window log in as a second user, play **Hard**, lose → first window gets a
   toast and the leaderboard row flashes **without refreshing**.

## 2. Version control (≈ 45 s)
* `git log --graph --oneline --all` → feature branch per week, merge commits, tags.
* `git checkout week-03` → show the early prototype; `git checkout main` to return.
* Point at `docs/weekly-log.md`.

## 3. Event-driven (≈ 45 s)
* `public/js/main.js` – click / keydown / submit listeners, event delegation on number pad.
* `public/js/game.js` – `setInterval` countdown → `puzzle:timeout`.
* `public/js/eventBus.js` – custom events; `ui.js` only listens.
* `server/events/handlers.js` – `game:finished` → save → `score:saved` → SSE push.

## 4. Interoperability (≈ 45 s)
* Yes, I use the Tomato API: `server/services/tomatoApi.js` – HTTPS GET, JSON, timeout.
* Design choice: server calls the API so the **solution never reaches the browser**.
* `puzzleProvider.js` – fallback + circuit breaker when the API is down.

## 5. Virtual identity (≈ 45 s)
* `server/auth/auth.js` – bcrypt hash, JWT in HttpOnly + SameSite cookie, `requireAuth`.
* DevTools → Application → Cookies: `tr_session` (HttpOnly ✔) vs `tr_last_user` (readable).
* Wrong password ×5 → "Too many failed logins" (IP throttling). Last-login IP toast.

## 6. Next steps (≈ 20 s)
* From `docs/roadmap.md`: SQLite, Google sign-in (OAuth) for comparison, head-to-head
  mode with WebSockets, CI with GitHub Actions.

## Questions the tutor might ask
* *Why does the server call the Tomato API, not the browser?* – the API returns the answer;
  in the browser anyone could read it. Server-side keeps the game fair.
* *What happens if the API is down?* – timeout after 5 s, offline SVG puzzle, API skipped for 30 s.
* *Why JWT in a cookie, not localStorage?* – HttpOnly cookie can't be read by injected
  JavaScript (XSS), SameSite blocks cross-site requests (CSRF).
* *Where did you use AI / other code?* – `docs/references.md` + header comments in each file.
