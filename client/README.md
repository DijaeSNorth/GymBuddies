# Gym Buddies

Gym Buddies is an original, GBA-inspired creature-collection fitness RPG. The
React application shell owns menus and accessible UI, Phaser renders the
240×160 overworld, and pure TypeScript modules own serializable gameplay state.

## Play

The public GitHub Pages release is configured for:

[https://dijaesnorth.github.io/GymBuddies/](https://dijaesnorth.github.io/GymBuddies/)

The repository name and path are case-sensitive in release tests:
`DijaeSNorth/GymBuddies` and `/GymBuddies/`.

After one successful online visit finishes installing the release cache, the
core game can load offline. Saves remain in browser local storage and are not
placed in the service-worker cache. Use the in-game JSON export periodically if
the journey needs to move between browsers or devices.

## Development

Run commands from the `client` directory. Node.js 22 is used by the deployment
workflow.

```bash
npm ci
npm run dev
```

Vite serves development at `/`, while production builds use the configured
GitHub Pages base path from `deployment.config.json`.

Create and inspect a production release locally:

```bash
npm run build
npm run preview:pages:test
```

The release build includes an exact-case Pages path, a PWA manifest, generated
install icons, a content-hashed offline cache, a public copy of the game asset
manifest, and a `404.html` fallback for refreshed Pages navigation.

## Testing

Vitest covers deterministic simulation, saves, content validation, movement,
collision, progression, capture, workouts, bosses, audio, and input mapping.
Playwright covers rendered onboarding, save persistence and migration, keyboard
and touch controls, settings, offline loading, and GitHub Pages subpath loading.
Gameplay tests use the seeded random helpers in
`src/game/systems/random.ts`.

Install the Chromium test browser once:

```bash
npx playwright install chromium
```

Run the complete verification suite:

```bash
npm run test:all
```

Run individual layers:

```bash
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:e2e:desktop
npm run test:e2e:mobile
npm run test:e2e:pages
npm run smoke:deploy
npm run build
```

`npm run smoke:deploy` performs a clean release build, serves it beneath
`/GymBuddies/`, checks refresh behavior, validates every sprite and audio file
from the public asset manifest, verifies PWA resources and cache versioning, and
reloads a real local save while the browser is offline.

Playwright uses condition-based assertions instead of fixed sleeps. Failed
browser tests retain a trace and screenshot in ignored local output folders.

### Coverage map

| Area | Primary automated coverage |
| --- | --- |
| New game, trainer creation, save creation | `e2e/onboarding.pw.ts`, `src/tests/trainerCreation.test.ts` |
| Save migration and corrupted-save recovery | `src/tests/saveService.test.ts`, `e2e/onboarding.pw.ts` |
| Movement, collision, route unlocking, encounters | `src/tests/overworldMovement.test.ts`, `src/tests/worldJourney.test.ts` |
| Workouts and Spot Now outcomes | `src/tests/workoutMiniGame.test.ts` |
| Buddy XP and leveling | `src/tests/gameSystems.test.ts`, `src/tests/verticalSlicePlaythrough.test.ts` |
| Capture outcomes and full-party handling | `src/tests/captureBattles.test.ts`, `src/tests/verticalSlicePlaythrough.test.ts` |
| Boss availability, completion, and recovery | `src/tests/bossChallenges.test.ts`, `src/tests/verticalSlicePlaythrough.test.ts` |
| Audio settings and keyboard controls | `src/tests/audioSystem.test.ts`, `src/tests/inputAccessibility.test.ts`, `e2e/controls-and-settings.pw.ts` |
| Touch controls | `e2e/touch-controls.pw.ts` |
| Production, offline cache, and GitHub Pages paths | `e2e/github-pages.pw.ts` |
| Every gym and permanent reachability | `src/tests/worldJourney.test.ts`, `src/tests/verticalSlicePlaythrough.test.ts` |

## Deployment

`.github/workflows/deploy.yml` is the only release workflow. A push to `main`
that changes the client or workflow runs typechecking, deterministic unit tests,
the production build, and the deployment smoke test before uploading
`client/dist` with the official GitHub Pages actions. A failed validation step
prevents deployment.

Repository setup:

1. In GitHub, open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push the verified client changes to `main`, or run the workflow manually
   with **workflow_dispatch**.
4. Confirm the `github-pages` environment reports the release URL.

The service worker derives its cache name from the version, base path, output
file names, and output file contents. Activating a new release deletes older Gym
Buddies core caches. It caches only same-origin build resources and never
intercepts writes or stores local-save data.

## Representative saves

Representative current, legacy-v12, full-party, boss-ready, and corrupted-save
fixtures live in `src/tests/fixtures/saveFixtures.ts`. These fixtures are shared
between migration, recovery, integration, and browser tests so they cannot
silently drift away from the current schema.
