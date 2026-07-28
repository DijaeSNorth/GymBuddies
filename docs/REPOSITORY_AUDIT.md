# GymBuddies Repository Audit

Audit date: 2026-07-28

This audit is read-only with respect to game code and configuration. The only
working-tree addition made for the audit is this document.

## Executive conclusion

The actual Git repository root is:

`C:/Users/jaysl/Documents/Ralph John`

Its `origin` remote is:

`https://github.com/DijaeSNorth/GymBuddies.git`

The repository currently has two independent GymBuddies histories:

- `origin/main` at `3a808af653095e8103694ecb33dbe56e154bdf41` is the
  remote default branch and contains the smaller save-v3 game.
- Local `master` and `origin/master` are both at
  `6758674fb602a1ce848792693aae4f65baeac27e` and contain the larger save-v12
  game.

The branches have no common ancestor. A three-dot comparison reports 159
commits unique to `origin/main` and 24 commits unique to `master`, but those
counts must not be interpreted as a normal ahead/behind relationship.

The save-v12 implementation exists locally, is byte-for-byte identical to
`HEAD`, and is already committed and pushed on `origin/master`. It is not an
uncommitted working copy.

**Canonical decision:** the save-v12 implementation on `master` should be
treated as the canonical GymBuddies game. The save-v3 implementation on
`origin/main` is an older, substantially smaller game and must not overwrite
the v12 source.

## Repository and branch state

Commands used:

```text
git rev-parse --show-toplevel
git remote -v
git branch --all --verbose --no-abbrev
git log --all --graph --decorate --oneline
git ls-remote --symref origin HEAD refs/heads/main refs/heads/master
git fetch origin main:refs/remotes/origin/main
git rev-list --left-right --count origin/main...HEAD
git merge-base origin/main HEAD
```

Findings:

- Repository root: `C:/Users/jaysl/Documents/Ralph John`
- Active branch: `master`
- Active commit: `6758674`
- Upstream: `origin/master`
- Local `master` versus `origin/master`: identical
- Live remote default branch: `main`
- Live `origin/main`: `3a808af`
- Common ancestor between `origin/main` and `master`: none
- Staged changes before this audit document: none
- Modified tracked files before this audit document: none
- Deleted tracked files before this audit document: none

## File-state inventory

### Tracked on canonical `master`

Only three files are tracked:

```text
.github/workflows/deploy.yml
client/src/App.tsx
client/src/index.css
```

All three matched `HEAD` at audit time. There were no tracked modifications or
deletions.

### Ignored

The working tree reports these ignored paths:

```text
.env
dist-ghpages/
dist-server-test/
node_modules/
```

They must remain excluded. Generated builds, dependencies, and local
environment files must not be committed.

### Untracked

The untracked set is large because the working directory contains a separate
application scaffold and its source tree. Git reports these top-level groups:

```text
.env.example
.gitignore
MULTIPLAYER_UPGRADE_DUMPS.md
MULTIPLAYER_UPGRADE_NOTES.md
README.md
REPLAY_MODE_CONTEXT.md
REPORT_SYSTEM_CONTEXT.md
client/index.html
client/src/components/
client/src/config/
client/src/data/
client/src/engine/
client/src/hooks/
client/src/main.tsx
client/src/rules/
client/src/store/
client/src/types/
database.rules.json
firebase.json
functions/
package-lock.json
package.json
postcss.config.js
resources/
script/
server/
tailwind.config.ts
test-safety.ts
tests/
tsconfig.json
vite.config.ts
vite.ghpages.config.ts
```

These paths were not treated as GymBuddies implementation evidence merely
because they are physically present. All On-Da-Stack files are explicitly
excluded from this audit's canonical file set and from all future GymBuddies
commits. No On-Da-Stack path may be staged, modified, or committed as part of
GymBuddies work.

Two untracked bootstrap paths mention or directly launch GymBuddies:

- `client/src/main.tsx` is a minimal React entry point that imports `App` and
  `index.css`. It is required by a standalone Vite build but is not committed
  on `master`.
- `client/index.html` has a Gym Buddies page title, but it still contains stale
  branding and an oversized external-font scaffold from the other
  application. It must not be committed as-is.

The correct future action is to create or sanitize a small GymBuddies-owned
entry point and HTML shell in a focused setup change, not to bulk-add the
untracked tree.

## Requested file comparison

Git blob IDs are included so later work can verify that the audited source was
preserved.

| File | Local/`master` | `origin/main` | Finding |
|---|---:|---:|---|
| `client/src/App.tsx` | 5,420 lines; blob `8fa271a`; save v12 | 944 lines; blob `220981c`; save v3 | Local v12 is much larger and canonical. |
| `client/src/index.css` | 1,598 lines; blob `def55e5` | 491 lines; blob `f626649` | Local styling contains the expanded world, workout, boss, and setup UI. |
| `package.json` | Untracked; 42 lines; blob `baea1f5` | Tracked on main; same blob | Absent from `master`; identifies a different application and includes unrelated dependencies and scripts. Exclude it. |
| `vite.config.ts` | Untracked; 37 lines; blob `0eaa6f8` | Tracked on main; same blob | Absent from `master`; contains unrelated aliases and chunk rules. Do not commit as-is. |
| `vite.ghpages.config.ts` | Untracked; 33 lines; blob `a6d6539` | Tracked on main; same blob | Absent from `master`; preserves relative `base: "./"` but also contains unrelated aliases/chunks. Re-create a minimal GymBuddies version later. |
| `.github/workflows/deploy.yml` | Tracked; 64 lines; blob `2e4e109`; triggers on `master` | 64 lines; blob `4323c9c`; triggers on `main` | The branch trigger is the only content difference. The rest still carries unrelated environment setup. |

Direct `origin/main` to `master` source differences:

```text
.github/workflows/deploy.yml   1 insertion, 1 deletion
client/src/App.tsx             4,644 insertions, 168 deletions
client/src/index.css           1,273 insertions, 166 deletions
```

### Deployment workflow risk

The tracked workflow runs `npm ci` and `npm run build:pages`, but `master`
does not track `package.json`, a lockfile, the HTML shell, the React entry
point, TypeScript configuration, or a Vite configuration. A clean checkout of
`master` therefore cannot build successfully.

The workflow also sets environment values for the excluded application. Those
steps are not part of GymBuddies and must be removed when a clean,
GymBuddies-only workflow is created.

## Smaller save-v3 implementation on `origin/main`

The `origin/main` version uses:

```text
const SAVE_KEY = 'gymbuddies-save-v3';
```

Its 944-line `App.tsx` contains:

- six selectable gym areas;
- a team of up to six Buddies;
- simple XP training;
- a steroid action;
- manual wild encounters;
- a three-move arm-wrestling capture meter;
- seen/caught index state; and
- a short activity log.

It does not contain the v12 trainer profile, machine catalog, tile routes,
route unlocking, global fatigue/readiness loop, workout spot sessions, deload
and momentum systems, timed gym bosses, challenge-machine alignment, advanced
capture pressure, tutorial opening flow, or generated audio engine.

## Local save-v12 implementation

The canonical local file declares:

```text
const SAVE_VERSION = 'v12';
const SAVE_KEY = `gymbuddies-save-${SAVE_VERSION}`;
```

Major local feature set:

- Trainer creation with four presets, custom colors, name, eight muscle
  groups, physique level, reopening, continuation, and opening reset.
- Five-step tutorial with Home Gym start and optional guided travel.
- Six gyms connected by five named tile routes.
- Keyboard movement through WASD and arrow keys.
- Touch/click movement through route buttons and an on-screen D-pad.
- Facing direction, stride lock, route signs, travel overlays, unlock
  progression, route fatigue, scouting bonuses, and encounter cooldowns.
- Twenty-four training machines with focus, XP, recovery, fatigue, and reward
  configuration.
- Eleven original Buddy species, including exotic encounters, with a six-slot
  team and seen/caught index.
- Buddy XP, level, HP, Form, Mobility, and Volume progression.
- Timed workout sessions with readiness, load tier, set stress, quality,
  consistency, deload tokens, momentum, failure, and a spot window.
- Global fatigue with passive recovery, a controlled rest action, and steroid
  boosts.
- Manual and route-based encounters with zone-scaled levels and rarity.
- Three-move capture battles using trainer, Buddy, machine, readiness,
  fatigue, meter, and zone calculations.
- Twelve timed boss variants across six gyms.
- Low/normal/high boss challenge tiers, required machines, streaks, misses,
  near misses, overload, dynamic capture targets, and zone-specific balance.
- Pixel-art trainer/Buddy rendering, workout and combat state animation,
  route UI, stress meters, transition cards, log, and broadcast status.
- Original Web Audio synthesis for zone music and gameplay sound effects,
  with separate music/SFX controls.
- Browser-local persistence for trainer, team, progression, zones, machines,
  boss schedules, tutorial, fatigue, workout state, and audio settings.

The v12 game currently supports keyboard and touchscreen/click controls.
No Gamepad API usage was found, so gamepad compatibility is an unresolved
requirement rather than an existing feature to preserve.

## Uncommitted GymBuddies requirements

The core v12 game code and styling are committed on `master`; they are not
uncommitted.

What is missing from the canonical branch is a clean, committed,
GymBuddies-owned project shell:

- minimal `package.json` and lockfile;
- minimal TypeScript configuration;
- minimal Vite and GitHub Pages configuration;
- clean `client/index.html`;
- clean `client/src/main.tsx`;
- GymBuddies-specific `.gitignore`;
- focused tests and validation scripts; and
- a clean deployment workflow.

The similarly named local package/configuration files are exact copies of
files on the mixed `origin/main` tree and are not acceptable substitutes.
They must remain excluded rather than being added wholesale.

## Canonical version and preservation requirements

Treat `master` commit `6758674` as the source baseline and preserve:

1. The exact audited v12 blobs:
   - `client/src/App.tsx` at `8fa271a`
   - `client/src/index.css` at `def55e5`
2. The 24-commit `master` history and the remote `origin/master` backup.
3. The `gymbuddies-save-v12` storage boundary. Any future save-schema change
   needs an explicit migration or deliberate version reset.
4. Trainer creation, routes, all six gyms, all 24 machines, fatigue/readiness,
   workouts, recovery, Buddy progression, encounters, timed bosses, advanced
   captures, audio, tutorial, index/log, and opening/reset flows.
5. Existing WASD, arrow-key, click, and touchscreen/D-pad interactions.
6. Relative GitHub Pages asset-path behavior.
7. Original creatures, names, pixel art, dialogue, branding, and synthesized
   audio.

Do not merge `origin/main` into `master`: the histories are unrelated and the
main tree contains excluded application files. If the repository should use
`main` as its long-term default branch, first preserve both remote branch tips,
then perform an explicit branch migration from the v12 history.

## Recommended pre-refactor sequence

1. Create a branch from v12 `master`, never from the mixed `origin/main`.
2. Add a minimal GymBuddies-only React/Vite/TypeScript shell and lockfile.
3. Replace the deployment workflow with a GymBuddies-only Pages build while
   keeping a relative base path.
4. Establish typecheck, lint, unit-test, production-build, keyboard/touch
   smoke-test, and gamepad-input baselines.
5. Add regression tests around save loading, routes, fatigue, workouts, boss
   challenges, and captures.
6. Only then extract configuration and gameplay rules from the 5,420-line
   component in small phases, keeping rendering/UI separate from rules.
7. After the clean v12 branch is verified and backed up, decide whether to
   change the GitHub default branch from the old `main` history.

## Validation performed

- Verified the live GitHub branch tips without changing the working tree.
- Fetched `origin/main` into its normal remote-tracking ref for comparison.
- Verified `master` and `origin/master` point to the same commit.
- Verified no common ancestor exists between `origin/main` and `master`.
- Enumerated tracked, modified, deleted, ignored, and untracked paths.
- Compared requested files by physical line count, Git blob ID, and direct
  diff.
- Verified the v12 `App.tsx`, `index.css`, and deployment workflow matched
  `HEAD` before documentation was added.
- Searched the v12 source for keyboard, touchscreen, and gamepad support.

Typecheck, tests, lint, and production build were not run during this audit.
The canonical branch does not yet contain a trusted GymBuddies package or
build configuration, and invoking the untracked scripts would execute the
excluded application's toolchain.
