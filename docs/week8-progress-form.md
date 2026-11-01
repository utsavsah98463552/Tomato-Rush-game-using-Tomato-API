# CIS046-3 Week 8 Progress Form – answers

(Copied onto the printed form for the Week 8 presentation.)

## Version Control
*How did you develop your code (e.g., what features have been added after first version)?*

Developed in Git with one feature branch per week, merged into `main` with merge commits and
tagged `week-01` … `week-08` (history: `git log --graph`). W1 design & architecture; W2 Express
server; W3 first version – Tomato API prototype (show puzzle, check answer); W4 game GUI,
timer, lives, scoring moved to the server; W5 register/login with hashed passwords and
cookies; W6 saved scores, leaderboard, player stats; W7 live leaderboard (Server-Sent
Events), offline fallback puzzles, login throttling, 19 automated tests; W8 polish + docs.

## Event Driven Architectures
*What in your code triggers events (e.g., GUI, buttons, timeout …)?*

GUI: button clicks (number pad, difficulty, quit, logout), keyboard (0–9, Esc, Enter), form
submit (login/register), dropdown change (leaderboard filter). Timers: `setInterval`
countdown; reaching zero fires a time-out. Custom browser event bus (`game:started`,
`answer:result`, `game:over`…) decouples game logic from UI. Server: HTTP requests trigger
Express handlers; Node `EventEmitter` – `game:finished` → save score → `score:saved` →
pushed live to all browsers via Server-Sent Events (`EventSource`).

## Interoperability
*Do you use the API https://marcconrad.com/uob/tomato/api.php?*

**Yes.** My Node.js server calls the PHP Tomato API with HTTPS GET and parses the JSON
`{question, solution}` (5 s timeout, response validated). The server keeps the solution and
sends only the image to the browser, so answers can't be read in DevTools.
Also: browser ⇄ server via my own REST/JSON API + Server-Sent Events; if the Tomato API is
unreachable the server falls back to locally generated SVG puzzles.

## Virtual Identity
*How did you implement virtual identity in your code? (e.g., Passwords, Cookies, IP Numbers …)*

Passwords: register/login, stored only as bcrypt hashes; same error for wrong user or
password. Cookies: signed JWT (2 h expiry) in an HttpOnly, SameSite=Strict cookie, checked
by middleware on every game request; plus a readable cookie remembering the username.
IP numbers: 5 failed logins per IP in 10 min are blocked (HTTP 429); last login time + IP
shown to the user.

## Any other interesting features
Three difficulty levels, streak & time bonuses, server-authoritative scoring (anti-cheat),
live leaderboard updates across browsers, offline mode when the API is down, automated
unit + integration tests (`npm test`), full docs and references (incl. AI use).
Next: SQLite, Google sign-in (OAuth) for comparison, head-to-head mode with WebSockets.
