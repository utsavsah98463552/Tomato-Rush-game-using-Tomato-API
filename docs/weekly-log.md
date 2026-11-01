# Weekly Progress Log

Each week's work is developed on its own branch, merged into `main` with a merge commit,
and tagged `week-0N` so the state of the project at any week can be checked out:

```bash
git checkout week-03   # look at the project as it was in week 3
git checkout main      # back to the latest version
```

## Week 1 – Commenting & code design
* Chose the stack (Node.js + Express + plain JavaScript) – reasons in `architecture.md`.
* Drew the client / server / Tomato API architecture.
* Set up the repository, `.gitignore` and folder plan.
* Placeholder `public/index.html` with the screen layout sketched in comments.

## Week 2 – Version control & server set-up
* Branching strategy and commit conventions written in `version-control.md`.
* `package.json` + Express installed; `package-lock.json` committed.
* `server/server.js` serves the static front end and a `/api/health` endpoint.
* Settings moved into `server/config.js` (read from environment variables).

## Week 3 – Interoperability: Tomato API
* `server/services/tomatoApi.js` calls the Tomato API (HTTPS GET, JSON response) with a
  5-second timeout and validates the response.
* **Design decision:** the browser never calls the Tomato API directly. My server keeps
  the solution and only sends `{puzzleId, image}` to the browser, so the answer cannot be
  read in the browser's developer tools.
* `GET /api/game/puzzle` and `POST /api/game/answer` endpoints.
* First prototype page: shows a puzzle, checks an answer, loads the next one.
* External sources documented in `docs/references.md`.

## Week 4 – GUI & events
* Real game screen: HUD (score, puzzle no., streak, lives), timer bar, puzzle image,
  0–9 number pad, feedback banner, game-over screen.
* **Event-driven design in the browser**
  * DOM events: `click` (with event delegation on the number pad), `keydown` (0–9, Esc).
  * Timer events: `setInterval` tick every 100 ms; reaching 0 fires `puzzle:timeout`.
  * Custom event bus (`eventBus.js`, built on `EventTarget`/`CustomEvent`): the
    `GameController` emits `game:started`, `puzzle:loaded`, `answer:result`, `game:over`;
    `ui.js` only listens and redraws (observer pattern, loose coupling).
* **Game rules moved to the server** (`gameService.js`): lives, score, streak and the
  time limit are checked by the server so a player cannot cheat from the browser.
* Difficulty levels: Easy / Normal / Hard.
* Central Express error handler; friendly message when the Tomato API is down.

## Week 5 – Authentication & cookies (virtual identity)
* Register / login / logout with `POST /api/auth/*`, `GET /api/auth/me`.
* Passwords hashed with **bcrypt** (10 salt rounds); only the hash is stored.
* Login creates a signed **JWT** (2 h expiry) stored in an **HttpOnly, SameSite=Strict**
  cookie (`Secure` in production). `requireAuth` middleware protects all game routes, so
  every game belongs to a verified user.
* Same error message for unknown user and wrong password (no user enumeration).
* Second, JavaScript-readable cookie `tr_last_user` remembers the username on the login
  form – shows the difference between an identity cookie and a preference cookie.
* Accounts saved in `data/db.json` through a small data-access layer (`store.js`).
* Secrets configured via environment variables (`.env.example`); server refuses to start
  in production without `JWT_SECRET`.
* Bug fixed after testing: form stayed on "Create account" tab after logout.
