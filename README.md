# Tomato Rush 🍅

A browser puzzle game for **CIS046-3 Software for Enterprise**
(University of Bedfordshire, AY 26/27). Players log in, solve picture puzzles served by
Marc Conrad's **Tomato API** against the clock, and compete on a **live leaderboard**.

> Status: **v1.0 – Week 8 demo version.** Fully playable; see `docs/roadmap.md` for what comes next.

---

## Quick start

Requirements: **Node.js 18 or newer** (check with `node -v`).

```bash
npm install        # install dependencies (express, bcryptjs, jsonwebtoken, cookie-parser)
npm start          # start the server
```
Open **http://localhost:3000**, create an account and play.

| Command | What it does |
|---|---|
| `npm start` | Run the server |
| `npm run dev` | Run and restart automatically when a file changes |
| `npm test` | Run the 19 automated tests |

Optional settings (see `.env.example`): `PORT`, `JWT_SECRET`, `TOMATO_API_URL`, `DATA_FILE`.

**No internet?** The game still works – it switches to locally generated "offline puzzles"
automatically (look for the *offline puzzle* tag under the image).

## How to play
1. Register or log in.
2. Pick a difficulty – Easy (30 s, 3 ❤️, ×1), Normal (20 s, 3 ❤️, ×2), Hard (10 s, 2 ❤️, ×3).
3. Each puzzle hides one digit **0–9**. Click it on the number pad or press the key.
4. Correct → `100 × multiplier + time bonus + streak bonus`. Wrong or time-out → lose a life.
5. Out of lives → game over, score saved, leaderboard updates for everyone instantly.

---

## The four themes in this code

| Theme | Where to look |
|---|---|
| **Version control** | Git history: feature branch per week, `--no-ff` merges, tags `week-01`…`week-08`, `v1.0.0`. See `docs/version-control.md`, `docs/weekly-log.md`. Try `git log --graph --oneline --all`. |
| **Event-driven programming** | Browser: `click`/`keydown`/`submit`/`change` listeners (`public/js/main.js`), `setInterval` countdown + time-out (`game.js`), custom event bus (`eventBus.js`), `EventSource` messages (`live.js`). Server: Express route handlers, Node `EventEmitter` `game:finished` → `score:saved` (`server/events/`), SSE push, `req.on('close')`, cleanup timer. |
| **Interoperability** | Node server ⇄ PHP **Tomato API** over **HTTPS GET + JSON** (`server/services/tomatoApi.js`) with timeout, validation and fallback. Browser ⇄ server via a **REST/JSON API** and **Server-Sent Events**. |
| **Virtual identity** | Passwords hashed with **bcrypt**; **JWT** in an **HttpOnly, SameSite=Strict** cookie; `requireAuth` middleware; readable "remember username" cookie for contrast; **IP-based** login throttling; last-login time + IP shown to the user (`server/auth/`, `server/routes/authRoutes.js`, `public/js/auth.js`). |

## Architecture

```
Browser (HTML/CSS/JS modules) ──REST/JSON + cookie──► Node.js / Express ──HTTPS/JSON──► Tomato API (PHP)
        ▲                                                │
        └──────────── Server-Sent Events (live) ─────────┘── JSON file store (data/db.json)
```
The **server is authoritative**: it keeps each puzzle's solution, checks the time limit and
calculates the score. The browser never receives the answer before replying, so scores
cannot be faked from the developer tools. More in `docs/architecture.md`.

## API overview

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /api/auth/register` | – | Create account, sets session cookie |
| `POST /api/auth/login` | – | Log in (throttled per IP), sets session cookie |
| `POST /api/auth/logout` | – | Clear session cookie |
| `GET /api/auth/me` | ✔ | Current user |
| `GET /api/game/difficulties` | – | Difficulty settings |
| `POST /api/game/start` | ✔ | New game `{difficulty}` |
| `POST /api/game/:id/next` | ✔ | Next puzzle image (no solution) |
| `POST /api/game/:id/answer` | ✔ | `{answer: 0-9 or null}` → result |
| `POST /api/game/:id/quit` | ✔ | End game, score saved |
| `GET /api/leaderboard?difficulty=` | – | Top 10, best score per player |
| `GET /api/leaderboard/me` | ✔ | Personal statistics |
| `GET /api/leaderboard/stream` | – | Live score events (SSE) |
| `GET /api/health` | – | Server status |

## Project structure

```
server/
  server.js              Express app, middleware, error handler
  config.js              settings from environment variables
  routes/                authRoutes, gameRoutes, leaderboardRoutes (+ SSE stream)
  services/              tomatoApi (interop), puzzleProvider (fallback + circuit breaker),
                         fallbackPuzzle (offline SVG puzzles), gameService (rules & scoring)
  auth/                  auth.js (bcrypt, JWT cookie, requireAuth), rateLimiter.js (per IP)
  events/                gameEvents.js (EventEmitter), handlers.js (save score)
  data/store.js          JSON file data-access layer
public/
  index.html, css/style.css
  js/ main.js (DOM events), game.js (game loop & timer), ui.js (rendering),
      eventBus.js, api.js, auth.js (cookies), live.js (EventSource)
tests/                   node:test unit + integration tests
docs/                    architecture, weekly log, version control, references,
                         demo script, Week 8 form answers, roadmap
```

## Looking at earlier weeks
```bash
git tag                 # week-01 … week-08, v1.0.0
git checkout week-03    # project as it was in week 3 (Tomato API prototype)
git checkout main
```

## References and use of AI
All external code, libraries, documentation and AI assistance are listed in
[`docs/references.md`](docs/references.md) and in the header comment of each file.

## Author
Utsav Sah – CIS046-3 Software for Enterprise, AY 26/27
