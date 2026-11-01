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
