# Architecture

Browser-only ES modules, Vite static build. No server-side API, database, account or paid inference at runtime.

| Responsibility | Entry point |
| --- | --- |
| Campaign, officers, calls, deals, suspects | `src/content.js` |
| Deterministic game rules, clock, jobs, money, saves | `src/engine.js` |
| Input, screen state, modal lifecycle, one-second tick | `src/main.js` |
| Game/menu/document HTML rendering | `src/views.js` |
| Music, voice, effects and stored volume settings | `src/audio.js` |
| Desktop/mobile/reduced-motion presentation | `src/style.css` |
| Original SVG generator | `scripts/draw_art.py` |
| Offline-only Polza media generation | `scripts/generate_audio.py` |
| Spoken lines and Russian translations | `public/assets/dialogue.json` |
| Frozen playable assets | `public/assets/` |
| HyperFrames authored film, scene timing and captions | `videos/prologue/` |
| Engine contracts and complete campaign simulation | `tests/engine.test.js` |
| Browser integration and visual evidence | `tests/browser.mjs` |
| Static distribution, built locally | `play/` |

Game state version 1 is stored under `low-water-save-v1` in localStorage. Screen selection, pause and modal state are separate UI state. Reload resumes paused. Settings use `low-water-audio`. Runtime turns five authored calls per day into pending calls, occupied officers and jobs with completion times. No randomness: success depends on effective crew skill and tactic bonus. Missions cost stamina; overnight rest restores it.

The shift runs 08:00–18:00. Jobs started before 18:00 can finish afterwards, through the latest possible end at 20:29; the engine cap is 750 minutes and the loader accepts the same bound. Salary and day advancement happen once on the explicit end-shift action. The entire campaign ends after day 7 or dismissal.

Rendering preserves scrolling panels and the active action button across clock ticks. Native dialog traps focus and pauses simulation while open. A hidden browser tab pauses the game; no catch-up simulation runs when it returns.

Media generation is an authoring tool, not application functionality. API credentials live only in environment variables or an explicitly supplied local dotenv file. Media is downloaded and decoded before inclusion. No secrets are required to build or play. GitHub Actions are disabled; builds and checks run locally.
