# References & Acknowledgements

The brief requires that any code not written by me is clearly referenced. References are
also repeated as comments at the top of each source file where the code is used.

## Third-party services
| What | Source | Used in |
|---|---|---|
| Tomato API (puzzle images + solutions) | Marc Conrad, https://marcconrad.com/uob/tomato/api.php | `server/services/tomatoApi.js` |
| Unit example code (API query options, base64 decoding idea) | https://github.com/marcconrad/comparativeintegratedsystems | `server/services/tomatoApi.js` |

## Libraries (npm)
| Package | Purpose | Licence |
|---|---|---|
| express | HTTP server and routing | MIT |

## Documentation consulted
* Express guide – https://expressjs.com/
* MDN – fetch, AbortController – https://developer.mozilla.org/
* 12-factor config – https://12factor.net/config
