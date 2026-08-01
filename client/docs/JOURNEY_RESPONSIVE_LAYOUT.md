# Journey Responsive Layout

## Shared frame

The journey shell is fixed to the visual viewport with `height: 100dvh`, safe-area padding, hidden document overflow, and four rows:

1. compact status
2. flexible gameplay region
3. dialogue/objective
4. quick navigation

The gameplay region owns all remaining height. Decorative gaps shrink before the playfield scale. The Phaser viewport continues to calculate the largest clean integer scale that fits its wrapper and preserves nearest-neighbor rendering.

## Desktop

At widths above 760 CSS pixels, the gameplay region is a three-column grid:

```text
party summary | dominant Phaser playfield | contextual actions
```

- Party width: `minmax(104px, 11vw)`.
- Action width: `minmax(150px, 16vw)`.
- Playfield: all remaining width and height.
- At widths below 1040 px, the rails narrow and low-priority status copy is hidden.
- At heights below 760 px, gaps, status, dialogue, navigation, and action padding tighten before the canvas is reduced.

Measured Playwright results:

| Viewport | Document vertical overflow | Horizontal overflow | Playfield fully visible | Permanent rails/dialogue visible |
| --- | ---: | ---: | --- | --- |
| 1280x720 | 0 px | 0 px | yes | yes |
| 1366x768 | 0 px | 0 px | yes | yes |
| 1440x900 | 0 px | 0 px | yes | yes |
| 1920x1080 | 0 px | 0 px | yes | yes |

Desktop overlays are centered, capped at 96vw by 92dvh, and scroll internally. The Phaser canvas stays mounted once and does not resize or duplicate when a layer opens.

## Mobile portrait

At 760 px and below, or coarse pointers up to 900 px:

```text
compact status
horizontal party strip
Phaser playfield and touch deck
two-column context actions
dialogue/objective
five-item navigation
```

At 390x844:

- document overflow is 0 px in both axes during ordinary movement;
- the six party slots form one horizontal strip;
- action and navigation targets measure at least 44 CSS pixels high;
- the playfield consumes the available width;
- the existing touch D-pad, actions, Menu, and Pause remain accessible;
- safe-area padding uses `env(safe-area-inset-*)` at the shell and `env(safe-area-inset-bottom)` at navigation/sheets.

Secondary workspaces become bottom sheets. Sheets are full width, up to 78dvh, anchored above the bottom safe area, and scroll internally. The page behind them remains fixed. Large workspaces stack their desktop columns into one column.

## Encounter and workout behavior

Encounter presentation is layered within the playfield, keeping meters and characters separate from the external action rail. On mobile, battle actions remain below the arena and the whole ordinary journey stays in one visual viewport.

Training keeps the overworld movement-locked while allowing the workout timing surface to run. Other overlays pause gameplay. This distinction prevents background movement without disabling Rep or Spot Now input.

## Accessibility-responsive rules

- Focus rings come from the existing global accessibility system and are not clipped by the shell.
- Modal focus is trapped and restored on desktop and mobile.
- High contrast uses the existing document data setting; hierarchy and borders remain visible.
- Reduced motion removes the boss-ready pulse and retains static status text.
- Text is not scaled down below the existing pixel-font range to force fit; low-priority copy collapses first.
- Status, HP, disabled actions, and selection have text or shape cues in addition to color.

## Test coverage

`journey-workspace.pw.ts` covers desktop sizing, visibility, state-specific action rails, overlays, keyboard shortcuts, gamepad overlay navigation, tutorial placement, one-canvas behavior, route transition, training, encounter, boss-ready, high contrast, and reduced motion.

`journey-workspace-mobile.pw.ts` covers 390x844 page bounds, touch target sizing, bottom sheets, focus restoration, one-canvas behavior, and the mobile encounter layout. Existing touch, onboarding, performance, save, offline, and GitHub Pages tests remain part of the full suite.
