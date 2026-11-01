# Roadmap – after the Week 8 demo

The Week 8 version is a complete, demoable prototype. Plan for weeks 9–11 (finalise code,
record video) and ideas beyond:

## Week 9 – act on tutor feedback
* Apply feedback from the Week 8 session (record it in `weekly-log.md`).
* Move storage from the JSON file to **SQLite** behind the same `store.js` interface
  (shows the value of the data-access layer).
* Add **CSRF token** on state-changing requests (defence in depth on top of SameSite).

## Week 10 – features for a richer video
* **Second identity option: "Sign in with Google" (OAuth 2.0 / OpenID Connect)** – lets me
  compare delegated identity with my own password store in the video.
* **Head-to-head mode**: two players get the same puzzles at the same time; replace SSE
  with **WebSockets** for two-way events.
* **Achievements** (first win, 10-streak, 1000 points) raised as server events.
* Sound effects + "reduce motion" accessibility option.

## Week 11 – production readiness (stretch)
* Deploy (e.g. Render/Railway) with HTTPS so the `Secure` cookie flag is active.
* GitHub Actions CI: run `npm test` on every push / pull request.
* Branch protection on `main` + pull-request reviews.
* Structured logging and a `/api/metrics` endpoint.

## Known limitations (honest list for the video)
* Game sessions live in server memory – a restart ends running games.
* IP-based throttling can block a whole classroom behind one router, and attackers can
  change IP; per-account limits / CAPTCHA would be stronger.
* JWTs cannot be revoked before expiry (2 h); a server-side session store or token
  deny-list would allow "log out everywhere".
* JSON file storage is fine for a demo but not for many simultaneous writers.
