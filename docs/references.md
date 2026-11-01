# References & Acknowledgements

The brief requires that any code not written by me is clearly referenced. References are
also repeated as comments at the top of each source file where the code is used.

## Third-party services
| What | Source | Used in |
|---|---|---|
| Tomato API (puzzle images + solutions) | Marc Conrad, https://marcconrad.com/uob/tomato/api.php | `server/services/tomatoApi.js` |
| Unit example code (API query options, base64 decoding idea) | https://github.com/marcconrad/comparativeintegratedsystems | `server/services/tomatoApi.js` |
| Fredoka font (optional, falls back to system font) | Google Fonts, https://fonts.google.com/specimen/Fredoka | `public/index.html` |

## Libraries (npm)
| Package | Purpose | Licence |
|---|---|---|
| express | HTTP server and routing | MIT |
| bcryptjs | Password hashing | MIT |
| jsonwebtoken | Signed session tokens (JWT) | MIT |
| cookie-parser | Reads cookies in Express | MIT |

Testing uses Node's built-in `node:test` (no extra package).

## Documentation consulted
* Express guide – https://expressjs.com/ (static files, routing, error handling)
* MDN – fetch, AbortController, CustomEvent/EventTarget, document.cookie, Server-sent events / EventSource – https://developer.mozilla.org/
* Node.js docs – Events (EventEmitter), test runner – https://nodejs.org/api/
* OWASP cheat sheets – Session Management, Password Storage, Authentication – https://cheatsheetseries.owasp.org/
* 12-factor app, config – https://12factor.net/config
* M. Fowler – Circuit Breaker – https://martinfowler.com/bliki/CircuitBreaker.html
* Conventional Commits – https://www.conventionalcommits.org/

## Use of generative AI
The brief allows AI-generated code if it is acknowledged. **Claude (Anthropic), an AI
assistant, was used to help generate and structure the code, tests and documentation in
this repository.** Commits produced with its help carry a `Co-Authored-By: Claude` line.
I reviewed, ran and tested the code, and I am responsible for understanding and explaining
it. The video is my own work and own voice, as required (no AI used for the video).
