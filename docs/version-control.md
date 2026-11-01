# Version Control Strategy

## Tooling
* **Git** locally, **GitHub** as the remote (backup + evidence for the tutor).

## Branching model (simplified GitHub Flow)
* `main` – always runnable. Nothing is committed directly to `main` after week 1.
* `feature/<name>` – one branch per piece of work (usually one per week):

| Week | Branch | Merged into `main` as tag |
|---|---|---|
| 1 | (main) | `week-01` |
| 2 | `feature/server-setup` | `week-02` |
| 3 | `feature/tomato-api` | `week-03` |
| 4 | `feature/gui-events` | `week-04` |
| 5 | `feature/auth-cookies` | `week-05` |
| 6 | `feature/leaderboard` | `week-06` |
| 7 | `feature/live-and-resilience` | `week-07` |
| 8 | `release/v1.0` | `week-08`, `v1.0.0` |

* Branches are merged with `git merge --no-ff` so the history graph still shows where
  each feature started and ended (`git log --graph --oneline --all`).
* Tags mark milestones, so I can show the tutor the exact state of any week.

## Commit messages
[Conventional Commits](https://www.conventionalcommits.org/) style, one logical change per commit:
`feat:` new feature, `fix:` bug fix, `docs:`, `test:`, `refactor:`, `chore:`.

## What is NOT in git
`node_modules/` (re-created from `package.json` / `package-lock.json`), `.env` secrets and
the runtime `data/*.json` file with user accounts – see `.gitignore`.

## Dependencies
`package-lock.json` is committed so everybody installs exactly the same versions.
