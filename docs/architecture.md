# Tomato Rush – Architecture & Design

## 1. Goal
A small but complete *distributed* game that lets me discuss the four unit themes
from my own code:

| Theme | Where it lives in the code |
|---|---|
| Version control | Git history: one feature branch per week, merged into `main`, tagged `week-0N` |
| Event-driven programming | Browser DOM events, timers, a custom event bus (client); Node `EventEmitter`, HTTP routes, Server-Sent Events (server) |
| Interoperability | Server calls the Tomato API over HTTPS/JSON; browser talks to my server over a REST/JSON API |
| Virtual identity | Register/login with bcrypt-hashed passwords, JWT inside an HttpOnly cookie, IP-based login throttling |

## 2. Why this stack (language choice)
* **JavaScript everywhere** – Node.js on the server, plain JavaScript in the browser.
  One language keeps the code understandable for the class demo and it is one of the
  unit's example languages.
* **Express** – the most common minimal web framework for Node; easy to read routes.
* **No front-end framework / no build step** – plain HTML, CSS and ES modules, so every
  event listener is visible in the code (good for the event-driven discussion).
* **JSON file storage** – no database server to install for the demo. It is hidden
  behind a small data-access module (`server/data/store.js`) so it can be swapped for
  SQLite/MongoDB later without touching the rest of the code.

Alternatives considered: Java Swing (unit example, but desktop-only so harder to show a
client/server split), PHP (fine, but mixing PHP + JS = two languages).

## 3. High-level architecture

```
 ┌────────────── Browser (client) ───────────────┐        ┌────────── Node.js server ──────────┐        ┌──── Tomato API ────┐
 │ index.html + css                               │  HTTP  │ Express app                        │ HTTPS  │ marcconrad.com     │
 │ main.js  – wires DOM events                    │  JSON  │  /api/auth/*   register/login      │  GET   │ /uob/tomato/api.php│
 │ game.js  – game loop, timer                    │◄──────►│  /api/game/*   start/puzzle/answer │──────► │ returns            │
 │ ui.js    – renders screens                     │ cookie │  /api/leaderboard (+ SSE stream)   │  JSON  │ {question,solution}│
 │ eventBus – custom events between modules       │        │ services/ tomatoApi, gameService   │        └────────────────────┘
 └────────────────────────────────────────────────┘        │ auth/     bcrypt, JWT, rate limit  │
                                                           │ data/     JSON file store          │
                                                           └────────────────────────────────────┘
```

**Key design decision – the solution never reaches the browser.** The Tomato API returns
the answer together with the image. If the browser called the API directly, anyone could
read the answer in the developer tools. So my server calls the API, keeps the solution
in memory, and only sends the image to the browser. The server also checks timing and
calculates the score, so scores on the leaderboard can be trusted.

## 4. Game rules (target for the Week 8 demo)
* Log in (or register).
* Choose difficulty: Easy (30 s, 3 lives), Normal (20 s, 3 lives), Hard (10 s, 2 lives).
* Each round shows a Tomato puzzle image; the answer is a digit 0–9.
* Correct → points = base × difficulty + time bonus + streak bonus.
* Wrong or time-out → lose a life. 0 lives → game over, score saved, leaderboard updates live.

## 5. Planned folder structure
```
server/            Node.js back end
  server.js        entry point – builds the Express app
  config.js        settings (port, API url, secrets) from environment variables
  routes/          HTTP route handlers (one file per area)
  services/        business logic + Tomato API client
  auth/            password hashing, JWT cookie, rate limiting
  data/            data-access layer (JSON file store)
  events/          server-side EventEmitter
public/            static front end served by Express
  index.html, css/, js/
tests/             automated tests (node:test)
docs/              design, weekly log, references, demo script
```

## 6. Coding conventions
* Every file starts with a header comment: purpose, author, and **references** for any
  code that is not mine (unit examples, docs, Stack Overflow, AI assistance).
* JSDoc comments on exported functions.
* Small modules with one responsibility each.
