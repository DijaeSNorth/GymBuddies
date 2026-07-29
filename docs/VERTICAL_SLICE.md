# Gym Buddies Vertical Slice

**Status:** Design target; no implementation changes are authorized by this document.
**Source of truth:** The protected local v12 prototype.
**Target play time:** 15–20 minutes for a first-time player.
**Slice path:** Trainer Creation → Home Gym → Warm Up Path → Starter Gym A.

## Purpose

The vertical slice should answer one question:

> Is it fun to prepare a customized trainer and a small team, make a meaningful workout choice, explore a compact fitness world, and earn a new Buddy through a readable arm-wrestling challenge?

The slice is a polished, content-gated path through systems already represented in v12. It is not a replacement for the larger prototype. Features outside the slice must remain preserved in the protected snapshot even when they are hidden from the slice flow.

The slice proves these play values:

- **Ownership:** the trainer and team feel personal.
- **Preparation:** machine and recovery choices have understandable consequences.
- **Discovery:** leaving Home Gym leads quickly to a new place and a new Buddy.
- **Mastery:** the player can improve at arm wrestling rather than merely wait for luck.
- **Payoff:** the Starter Gym A boss tests what the player just learned.
- **Momentum:** the player finishes wanting to see the next route, machine, and species.

### Scope labels

- **Current v12:** verified behavior or content already present in the local prototype.
- **Slice decision:** the intended vertical-slice boundary, which may gate broader v12 content.
- **Needs validation:** a timing, balance, usability, or production choice that must be confirmed through implementation review or playtesting.

## 1. Required features

### 1.1 Opening and trainer creation

The opening must provide:

- A clear **New Game** and **Continue** choice when a valid v12 save exists.
- Trainer name entry.
- The four current body presets: **Balanced**, **Upper Power**, **Lower Power**, and **Athletic**.
- The current skin, hair, shirt, shorts, and shoe color choices.
- The current eight muscle controls for shoulders, chest, arms, triceps, back, core, quads, and calves.
- A live, original pixel-art trainer preview that updates as choices change.
- A clear confirmation step before entering Home Gym.
- Keyboard and touchscreen completion without requiring a mouse hover state.

Trainer choices are visual identity in this slice; they must not secretly create a dominant combat build. If appearance currently affects a gameplay calculation, that behavior must be documented before it is changed.

### 1.2 Slice content manifest

Only the following content is required to be reachable during the 15–20 minute slice:

| Content type | Included content | Slice purpose |
|---|---|---|
| Home location | Home Gym | Safe orientation, first workout, recovery, save/load anchor |
| Route | Warm Up Path | Short exploration beat and one guaranteed wild encounter |
| Challenge location | Starter Gym A | Higher-load training and the boss payoff |
| Home machine | Recovery Rack | Teaches recovery and low-risk preparation |
| Home machine | Mobility Dumbbells | Teaches a controlled training choice |
| Starter A machine | Flat Bench Press Rack | Teaches a stronger Power-focused choice |
| Starter A machine | Rope Pulley Station | Teaches a contrasting Grip-focused choice |
| Starting Buddy | Brawny Bear | First familiar team member |
| Starting Buddy | Titan Tortoise | Second familiar team member and comparison point |
| Wild Buddy | Iron Wolf | First capture target |
| Boss Buddy | Ripped Rhino, encountered as Bench Rhino | Starter Gym A mastery test |

All names above already exist in v12. The remaining locations, machines, species, and bosses are preserved but are outside the slice path.

**Needs validation:** confirm that Iron Wolf is the best first wild target after testing its readability and difficulty against the two starting Buddies. If it is replaced, the slice must still contain exactly four featured species and must use an existing original Gym Buddies species.

### 1.3 Home Gym

Home Gym is the safe learning space. It must let the player:

- See the trainer and current team immediately after creation.
- Understand the active Buddy, its health, level, relevant strengths, and fatigue.
- Inspect the Recovery Rack and Mobility Dumbbells before committing.
- Complete one short workout interaction.
- See which values changed and why.
- Recover enough to understand that rest is an active preparation choice.
- Find the exit to Warm Up Path without searching through unrelated menus.
- Save automatically and expose a visible save confirmation.

The Home Gym presentation should be compact enough that a new player can identify the trainer, machines, route exit, fatigue display, and primary action within 30 seconds.

### 1.4 One short route: Warm Up Path

Warm Up Path must:

- Connect Home Gym directly to Starter Gym A.
- Take approximately 30–60 seconds to cross without an encounter.
- Support four-direction movement with clear collision boundaries.
- Contain a small number of original environmental details that establish the connected fitness-world theme.
- Include one intentional landmark before the wild encounter and one visible destination cue toward Starter Gym A.
- Trigger one guaranteed first-run wild encounter with Iron Wolf.
- Avoid additional random encounters before the first wild encounter is resolved.
- Allow a direct return to Home Gym for recovery.

The current v12 route name and Home-to-Starter-A connection are retained. The guaranteed encounter is a slice pacing requirement so the evaluation does not depend on random timing.

### 1.5 Four training machines

The slice contains exactly four featured machine interactions:

1. **Recovery Rack** — a no-fatigue or negligible-fatigue recovery lesson.
2. **Mobility Dumbbells** — a low-load Stability lesson.
3. **Flat Bench Press Rack** — a higher-load Power lesson.
4. **Rope Pulley Station** — a higher-load Grip lesson.

Each machine must:

- Have a distinct silhouette and readable interaction prompt.
- Explain its focus, likely gain, fatigue cost, and recovery effect before confirmation.
- Use the existing workout rules and configuration values unless a separately approved balance change is made.
- Provide a short input-based workout interaction or result beat, not only an instant stat button.
- Give immediate visual and original audio feedback.
- Show the before-and-after effect in plain language.
- Be cancelable before the workout begins.
- Remain usable with keyboard and touchscreen controls.

At least one choice should feel useful before the wild encounter and one should feel useful before the boss. The player must not need to grind the same machine repeatedly to finish the slice.

### 1.6 Four original Buddy species

The four featured species are:

- **Brawny Bear**
- **Titan Tortoise**
- **Iron Wolf**
- **Ripped Rhino**

Each needs:

- An original name, silhouette, palette, sprite, and short personality description.
- A readable gameplay identity expressed through current stats and move outcomes.
- A consistent small-scale portrait or sprite wherever it appears.
- No copied creature design, naming pattern, animation, sound, interface frame, or lore from another franchise.

Brawny Bear and Titan Tortoise begin on the team. Iron Wolf is the wild capture. Ripped Rhino appears as the Starter Gym A boss named Bench Rhino. This arrangement proves team comparison, collection, and a boss-scale challenge with only four featured species.

### 1.7 One wild encounter

The first crossing of Warm Up Path must produce one authored encounter with Iron Wolf. The encounter must:

- Introduce the opponent before the match begins.
- Let the player inspect the active Buddy and change to the other starting Buddy.
- Explain that success creates a capture opportunity through competitive arm wrestling.
- Make retreat or defeat consequences explicit.
- Preserve progress if the player leaves to recover.
- Avoid permanently losing a Buddy or trainer customization.

The first encounter should be high-confidence after the tutorial is understood. One recoverable failure is acceptable, but repeated random failure is not.

**Needs validation:** the exact first-encounter protection. Candidate approaches are a generous initial target, a one-time rematch, or a short coached opening. It must teach the real system and must not fake success with an unrelated scripted cutscene.

### 1.8 Arm-wrestling capture

The existing arm-wrestling concept is the slice's signature mechanic. It must include:

- A visible pressure or position meter with a neutral starting point.
- The current three actions: **Shoulder Burst**, **Iron Grind**, and **Snapping Hook**.
- A concise description of each action's power/control tradeoff.
- An opponent response after every player action.
- Clear feedback for a strong choice, weak choice, near capture, success, and loss.
- A readable capture threshold and a short success celebration.
- A team update showing the newly captured Iron Wolf.
- A retry path that does not require replaying trainer creation.

The player should be making tactical choices, not rapidly tapping a single dominant action. The encounter should normally resolve in 45–90 seconds.

### 1.9 One gym boss

Starter Gym A culminates in **Bench Rhino**, using the existing Ripped Rhino species. The boss must:

- Be introduced as a named local challenge, not as an unexplained random encounter.
- Become available through a deterministic slice milestone, such as completing the first Starter Gym A workout.
- Require the same arm-wrestling rules learned from Iron Wolf.
- Clearly communicate its greater pressure, resistance, or target difficulty.
- Reward preparation without requiring a perfect machine choice.
- Permit a recovery-and-rematch loop after failure.
- End with a clear slice-complete result and save confirmation.

The broader v12 boss timer, boss pool, and advanced boss modifiers are not required for this slice. Bench Rhino must appear in time for a first-time player to finish within 20 minutes.

**Needs validation:** the precise trigger and difficulty. A player who completed one relevant workout and managed fatigue should have a strong chance of success; an unprepared player should still understand why the match was harder.

### 1.10 Fatigue and recovery

Fatigue must create a meaningful but forgiving preparation loop:

- Travel, higher-load workouts, and encounters can increase fatigue using existing rules.
- Current fatigue and its consequence are visible before the player commits to an action.
- Home Gym and the Recovery Rack offer a reliable recovery path.
- Passive recovery may remain, but the player must not be required to wait idly.
- High fatigue may reduce effectiveness or increase risk, but it must not create an unrecoverable state.
- Recovery must preserve captures, trainer customization, and other progress.

The slice should produce at least one moment where the player notices fatigue and chooses whether to recover or push forward.

### 1.11 Saving and loading

The slice uses the current v12 save identity and must:

- Autosave after trainer confirmation, the first workout, a successful capture, zone travel, recovery, and boss completion.
- Provide visible, non-intrusive confirmation that a save occurred.
- Offer **Continue** after a page refresh or app restart.
- Restore trainer appearance, name, location, team, Buddy state, fatigue, progression, audio settings, and slice milestone state.
- Reject malformed or incompatible data without a blank screen.
- Never silently replace a valid v12 save with a lower-version schema.

A tester must be able to reload at Home Gym, after capturing Iron Wolf, and immediately before the boss without losing completed progress.

### 1.12 Keyboard and touchscreen controls

Both input methods are first-class:

| Action | Keyboard | Touchscreen |
|---|---|---|
| Move | WASD or arrow keys | On-screen directional pad |
| Confirm/interact | Clearly labeled action key shown in context | Large primary action button |
| Back/cancel | Clearly labeled back key shown in context | Large secondary/back button |
| Choose machine, Buddy, or move | Focus navigation plus confirm, or direct selection | Direct tap |
| Pause/settings | Labeled key or reachable button | Reachable button |

The existing v12 WASD/arrow movement and on-screen directional pad are retained. The exact non-movement keyboard bindings must be confirmed from the implemented input map before UI labels are finalized.

Control requirements:

- No required action may depend on hover, right-click, multi-touch, or a physical keyboard.
- Touch targets should be at least 44 × 44 CSS pixels.
- Focus must be visible and ordered logically.
- Holding movement must not trigger accidental menu actions.
- The layout must work in portrait mobile, landscape mobile, and desktop viewport classes.
- Touch controls must not cover the trainer, encounter meter, or critical prompts.

Gamepad compatibility remains a project-wide requirement. Slice work must use a shared action map, must not remove any existing gamepad path, and must include a basic regression smoke test where gamepad behavior exists. Gamepad-specific onboarding, button-art variants, and full controller certification are not slice acceptance blockers because the requested slice is evaluated with keyboard and touchscreen.

### 1.13 GBA-inspired visual presentation

The slice should evoke the clarity and charm of a handheld pixel RPG while remaining wholly original:

- Low-resolution-inspired original sprites and tiles rendered with crisp edges.
- A limited, location-specific palette for Home Gym, Warm Up Path, and Starter Gym A.
- Compact dialogue and status panels designed for the game's own information hierarchy.
- Short original transitions for travel, encounters, captures, recovery, and boss arrival.
- Stable pixel scaling without blurred sprites or uneven nearest-neighbor enlargement.
- Readable modern text sizing and contrast; authenticity must not reduce accessibility.
- No copied layouts, battle screens, map shapes, iconography, fonts, animation timing, or visual motifs from Pokémon or another game.

HUD and menus should remain semantic interface elements where practical, while gameplay rules remain independent from rendering.

### 1.14 Original audio

The slice requires:

- **One original looping music track** that can support Home Gym, Warm Up Path, and Starter Gym A without becoming tiring during a 20-minute session.
- Original sound effects for at least interaction/confirm, workout impact, fatigue warning, arm-wrestling action, near capture, capture success, boss alert, recovery, and save confirmation.
- Independent music and sound-effect volume controls plus a mute option.
- A user gesture before audio starts, to comply with browser playback rules.
- Graceful play if audio is muted or unavailable.

The music and effects may use the current procedural Web Audio approach. Any later recorded or rendered assets require source files and provenance notes. No copyrighted melody, sample, or imitation track may be used.

### 1.15 Failure states and completion

The slice must handle these failures without dead ends:

- Invalid or incomplete trainer name.
- Wild arm-wrestling loss.
- Boss arm-wrestling loss.
- Excessive fatigue.
- Full or unavailable team slot.
- Invalid, incompatible, or unavailable save data.
- Muted or blocked audio.
- Touch interruption, viewport rotation, or page refresh.

Failure should cost a small amount of time or require recovery, while preserving learned information and major progress. Slice completion occurs when the player defeats Bench Rhino and sees:

- The result and reward.
- The current four-species collection state.
- A clear save confirmation.
- A brief teaser that the connected world continues, without exposing unfinished content as playable.

## 2. Features postponed until after the slice

“Postponed” means excluded from slice production and acceptance testing, not removed from the protected v12 prototype.

### World and progression

- Starter Gym B and the higher-tier gyms.
- The remaining routes beyond Warm Up Path.
- The full six-gym progression and endgame.
- Branching route events, rare route modifiers, and large exploration maps.
- Long-term rank, completion, collection, and replay systems.

### Content

- The other eight v12 Buddy species.
- The other twenty v12 training machines.
- The other eleven v12 boss entries.
- Exotic, mythic, rare, and multi-stage encounter pools.
- Additional music loops, biome mixes, and large sound libraries.

### Systems

- Advanced boss scheduling, multiple boss variants, and deep boss modifier stacks.
- Expanded capture conditions, rarity tuning, and late-game probability systems.
- Complex team storage, trading, breeding, evolution, or social features.
- Online accounts, cloud saves, leaderboards, multiplayer, and live events.
- Achievement, daily-task, monetization, or retention systems.
- Expanded gamepad onboarding, controller-specific button art, and full controller certification. Core gamepad compatibility must not regress.

### Presentation

- Cinematic story scenes and a large dialogue cast.
- Large animation sets for every species and machine.
- Multiple accessibility themes beyond the required baseline.
- Native-app packaging and offline installation beyond browser caching already supported.

## 3. Acceptance criteria

The slice is acceptable only when all functional, experiential, originality, and quality criteria below pass.

### Functional acceptance

- A fresh player can create a trainer and enter Home Gym without developer assistance.
- The player can inspect and use all four featured machines.
- Home Gym, Warm Up Path, and Starter Gym A are connected and cannot strand the player.
- The first Warm Up Path crossing reliably produces the authored Iron Wolf encounter.
- The player can capture Iron Wolf through the real three-action arm-wrestling system.
- Fatigue changes through play, is explained, and can be recovered without idle waiting.
- Bench Rhino reliably becomes available and can be challenged within the session.
- Winning the boss produces an unmistakable slice-complete state.
- New Game, autosave, Continue, refresh, and corrupted-save fallback all work.
- Every required action is completable with keyboard alone and touchscreen alone.
- Muting audio never blocks progress.
- A production build works at the configured GitHub Pages base path.

### Polish acceptance

- No placeholder copyrighted assets, borrowed melody, franchise terminology, or copied interface composition remains.
- All four Buddy species and all three locations are visually distinguishable at a glance.
- Every consequential action has visual feedback; key actions also have original audio feedback.
- Text does not clip at supported viewport sizes or at 200% browser zoom.
- The route, workout, capture, recovery, and boss transitions have no visible soft lock or stale overlay.
- There are no uncaught console errors during the complete journey.

### Fun-proof acceptance

Run at least five first-time moderated playtests using the same release candidate:

- At least four of five players finish in 20 minutes without the facilitator explaining controls.
- At least four of five can explain, in their own words, why they chose a machine or recovery action.
- At least four of five understand the three arm-wrestling actions well enough to make a deliberate second choice.
- At least four of five rate the wild capture and boss sequence 4/5 or higher for clarity and satisfaction.
- At least four of five say they would choose to visit the next gym or seek another Buddy.
- No more than one player mistakes the game or its creatures for an official entry in another creature-collection franchise.

These are initial proof thresholds, not long-term product KPIs. **Needs validation:** five players are enough to expose major slice problems, but a second round with a broader device and experience mix is required before wider release.

### Scope acceptance

- Slice work does not delete or overwrite protected v12 systems and content.
- Gameplay rules remain outside rendering and UI components when touched.
- Machine, species, route, boss, fatigue, and encounter values are configuration-driven.
- No On-Da-Stack file is modified, staged, committed, referenced, or included in build inputs.
- Build output, secrets, environment files, and temporary files remain uncommitted.

## 4. Playable 15–20 minute player journey

| Elapsed time | Player experience | System being proved |
|---|---|---|
| 0:00–2:30 | Choose New Game, name and customize the trainer, see the live preview, and confirm. | Ownership and visual identity |
| 2:30–4:30 | Arrive in Home Gym, meet Brawny Bear and Titan Tortoise, read the HUD, and inspect the two Home machines. | Team readability and safe orientation |
| 4:30–6:00 | Complete one short Mobility Dumbbells workout and see the result, fatigue, and save feedback. | Training choice and immediate growth |
| 6:00–7:00 | Use or inspect the Recovery Rack, then leave for Warm Up Path. | Recovery and preparation |
| 7:00–8:30 | Explore the short route, pass its landmark, and discover Iron Wolf. | Connected exploration and anticipation |
| 8:30–10:30 | Compare the two starting Buddies, learn Shoulder Burst, Iron Grind, and Snapping Hook, then capture Iron Wolf. | Signature arm-wrestling capture |
| 10:30–12:00 | See Iron Wolf join the collection, continue to Starter Gym A, and inspect the stronger machines. | Collection payoff and escalation |
| 12:00–14:30 | Use Flat Bench Press Rack or Rope Pulley Station, observe increased fatigue, and decide whether to recover or push forward. | Meaningful preparation tradeoff |
| 14:30–17:30 | Receive the Bench Rhino challenge, apply the learned actions, and complete or narrowly fail the boss match. | Mastery and preparation payoff |
| 17:30–20:00 | If needed, recover and rematch; then view the victory result, collection summary, save confirmation, and next-gym teaser. | Forgiving failure, closure, and desire to continue |

Pacing rules:

- Trainer creation must not consume more than three minutes unless the player chooses to linger.
- No required progress may wait on the current five-to-ten-minute random boss timer.
- The first wild encounter and boss must be deterministic within the slice journey.
- A single wild or boss loss may occur without breaking the 20-minute target.
- Repeated training is optional experimentation, never a completion gate.
- Tutorial text should appear immediately before the relevant decision and should be dismissible.

## 5. Testing requirements

### Automated rule tests

Add or retain tests around pure gameplay behavior for:

- Machine eligibility, configured rewards, fatigue cost, and recovery.
- Fatigue boundaries and recovery from the maximum supported value.
- Arm-wrestling move outcomes, meter limits, success, loss, and tie-like states.
- Wild and boss difficulty modifiers.
- Guaranteed first encounter and deterministic boss milestone.
- Team addition, full-team handling, and duplicate/species rules as currently defined.
- Save serialization, v12 round-trip restoration, missing fields, malformed data, and incompatible versions.
- Input actions independent of a specific keyboard, touch, or rendering component.

Tests should use seeded or injected randomness. They must not depend on wall-clock waits.

### Integration tests

Automate the critical path where practical:

1. New Game → trainer confirmation → Home Gym.
2. Home workout → fatigue/reward feedback → autosave.
3. Home Gym → Warm Up Path → guaranteed Iron Wolf encounter.
4. Arm-wrestling win → Iron Wolf added → reload preserves capture.
5. Starter Gym A workout → Bench Rhino unlocked.
6. Boss loss → recovery → rematch.
7. Boss win → slice-complete state → reload preserves completion.
8. Corrupt save → safe fallback without a blank screen.

Run the same critical path once with keyboard actions and once with emulated touch actions.

### Manual device and accessibility testing

Minimum manual matrix:

- Current Chrome and Edge on desktop with keyboard.
- One representative standards-based gamepad as a compatibility smoke test.
- Current Safari on a representative iPhone-sized viewport.
- Current Chrome on a representative Android phone-sized viewport.
- Portrait and landscape mobile orientations.
- 200% desktop zoom and increased mobile text size.
- Audio enabled, muted, and browser-autoplay blocked.
- Refresh or app backgrounding during route, encounter, and result states.

Accessibility checks:

- Full keyboard traversal with visible focus.
- Correct buttons, labels, headings, and status announcements for interface controls.
- Contrast checks for text, meter states, focus, warnings, and disabled controls.
- No essential meaning conveyed by color alone.
- Reduced-motion behavior for screen shake, flashes, and transitions.
- Touch targets and spacing verified at the smallest supported viewport.

**Needs validation:** confirm the minimum supported browser versions and physical device floor before release sign-off.

### Playtest protocol

- Recruit at least five people who have not been coached on the build.
- Include a mix of creature-RPG familiarity and fitness-game familiarity.
- Observe silently except when a technical defect prevents progress.
- Record completion time, help requests, machine choices, recovery decisions, move choices, failures, and stated desire to continue.
- Ask players to describe the training-to-capture loop without using wording from the tutorial.
- Log defects separately from preference feedback.
- Re-run the complete test after any change to capture balance, boss timing, controls, save schema, or route flow.

### Required project validation after every implementation phase

- Typecheck.
- Automated tests.
- Linting.
- Production build.
- A GitHub Pages base-path smoke test when routing, assets, or build configuration changes.

Errors introduced by slice work must be fixed before the phase is considered complete.

## 6. Performance requirements

These are release budgets for the slice, measured on the production build:

| Area | Requirement |
|---|---|
| Frame pacing | Target 60 frames per second; remain at or above 30 FPS during transitions and effects on the agreed minimum mobile device |
| Input response | Visible response within 100 ms for movement, confirm, cancel, machine input, and arm-wrestling choices |
| Startup | Reach an interactive title screen within 3 seconds on a representative mid-range phone over a warm or fast connection |
| Route/encounter transition | Begin visible transition feedback within 100 ms and complete normal transitions within 1 second |
| Save | Complete local save without a visible frame stall; confirmation appears within 500 ms |
| Memory | No steady growth over three complete slice replays in one browser session |
| Network dependency | The playable journey requires no runtime network request after the production assets are loaded |
| Bundle discipline | Keep the initial compressed application payload below 300 KB unless a measured, reviewed asset need justifies an increase |
| Images/audio | Use appropriately sized assets, crisp pixel scaling, and no unnecessary high-resolution or long uncompressed files |

Additional requirements:

- Avoid layout thrashing during movement, meter changes, and HUD updates.
- Pause or reduce nonessential animation when the page is hidden.
- Dispose or reuse audio nodes so repeat workouts and matches do not leak resources.
- Do not mount hidden late-game locations, creatures, or audio merely to support the slice.
- Preserve the configured GitHub Pages base path for all asset URLs.

**Needs validation:** the exact minimum mobile device and cold-network profile. Once chosen, keep the device, browser, and throttling preset fixed for comparable measurements.

## 7. Task breakdown in implementation order

Each phase should be a small, reviewable change. Run typecheck, tests, linting, and the production build after every phase.

### Phase 0 — Preserve and characterize the baseline

- Verify the v12 snapshot branch and tag remain reachable.
- Record the current build, test, lint, and typecheck commands.
- Add characterization tests for save/load, training, fatigue, captures, and boss spawning before changing those areas.
- Confirm all work is inside GymBuddies and explicitly exclude On-Da-Stack paths.

**Exit condition:** the current prototype behavior is reproducible and recoverable.

### Phase 1 — Define slice configuration

- Add one configuration boundary for the three included locations, four machines, four species, one wild encounter, and one boss.
- Keep balance values in data rather than UI components.
- Hide out-of-slice content without deleting it.
- Define stable milestone identifiers for trainer completion, first workout, Iron Wolf encounter/capture, Starter A workout, boss result, and slice completion.

**Exit condition:** the build can expose only slice content while protected v12 data remains intact.

### Phase 2 — Separate and test core rules

- Isolate or confirm pure rules for workout results, fatigue/recovery, arm-wrestling resolution, capture success, boss difficulty, and team updates.
- Inject randomness and time where needed so tests are deterministic.
- Keep rendering and audio as consumers of rule results.

**Exit condition:** the core journey can be simulated in tests without mounting the full UI.

### Phase 3 — Harden save/load

- Preserve the v12 save identity and document any additive slice fields.
- Add safe defaults and migration handling for missing slice milestones.
- Add visible save status and failure handling.
- Test refreshes at the required checkpoints.

**Exit condition:** no required slice progress is lost or able to corrupt a valid v12 save.

### Phase 4 — Unify input actions

- Map movement, confirm, cancel, pause, selection, and contextual interaction to shared actions.
- Bind the shared actions to keyboard and touchscreen.
- Add focus management, touch sizing, and reduced-motion hooks.
- Verify no gameplay rule reads raw DOM events directly.

**Exit condition:** the complete slice is operable independently with keyboard and touch.

### Phase 5 — Polish opening and Home Gym

- Tighten New Game/Continue and trainer creation.
- Clarify the Home Gym HUD, team state, route exit, and contextual prompts.
- Polish Recovery Rack and Mobility Dumbbells interactions.
- Add concise workout, fatigue, recovery, and save feedback.

**Exit condition:** a new player reaches Warm Up Path within seven minutes and can explain the preparation loop.

### Phase 6 — Build the Warm Up Path journey

- Limit the route to the short Home-to-Starter-A path.
- Polish collision, landmarking, entrance cues, and mobile controls.
- Add the guaranteed first-run Iron Wolf encounter.
- Preserve a clear return path to Home Gym.

**Exit condition:** route traversal is readable, brief, deterministic, and free of soft locks.

### Phase 7 — Polish wild capture

- Present Iron Wolf, active-Buddy comparison, and the three arm-wrestling actions.
- Improve meter, opponent-response, near-capture, success, and failure feedback.
- Add the forgiving first-encounter protection selected through testing.
- Confirm the team and save update after capture.

**Exit condition:** first-time players make deliberate choices and capture Iron Wolf within the pacing budget.

### Phase 8 — Polish Starter Gym A

- Expose Flat Bench Press Rack and Rope Pulley Station.
- Make their stronger load and different focus legible.
- Connect workout/fatigue state to boss preparation messaging.
- Keep Home recovery and rematch paths obvious.

**Exit condition:** the player understands why Starter Gym A is a step up from Home Gym.

### Phase 9 — Deliver the Bench Rhino finale

- Replace random wait dependency with the approved deterministic slice milestone.
- Tune Bench Rhino using current boss and arm-wrestling rules.
- Add boss introduction, loss/recovery/rematch, victory, slice completion, and next-gym teaser.
- Save and restore boss and completion state.

**Exit condition:** the boss is challenging, explainable, and reachable within 20 minutes.

### Phase 10 — Original visual and audio polish

- Normalize pixel scale, palettes, UI spacing, transitions, and effects across the three locations.
- Finalize the four featured Buddy presentations.
- Finalize one original music loop and the required original sound effects.
- Record asset and audio provenance.

**Exit condition:** the slice feels cohesive and contains no placeholder or unverified material.

### Phase 11 — Accessibility, performance, and release hardening

- Complete the manual device and accessibility matrix.
- Profile frame pacing, memory, input latency, startup, saves, and audio lifecycle.
- Validate the GitHub Pages production path.
- Fix all blocking defects and rerun the complete journey.

**Exit condition:** every functional, polish, scope, and performance criterion passes.

### Phase 12 — Fun validation and scope decision

- Run the first five-player playtest round.
- Fix blockers and the highest-impact clarity or pacing issues.
- Run a second confirmation round when capture balance, boss difficulty, or controls change materially.
- Decide whether the proven loop justifies expanding to Starter Gym B and the second route.

**Exit condition:** the fun-proof thresholds pass, or the team has explicit evidence for which core loop element must change before adding content.

## Slice completion definition

The vertical slice is complete when a new player can create a trainer, train and recover at Home Gym, cross Warm Up Path, capture Iron Wolf through arm wrestling, prepare at Starter Gym A, defeat Bench Rhino, save and reload progress, and finish in 15–20 minutes using either keyboard or touchscreen—within the originality, accessibility, quality, and performance boundaries above.
