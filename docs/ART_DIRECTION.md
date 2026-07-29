# Art Direction

## Visual thesis

Gym Buddies should feel like an original handheld-era fitness adventure:
compact pixel forms, bold silhouettes, limited palettes, readable state
changes, and expressive interface motion. “GBA-inspired” describes production
constraints and nostalgia, not permission to copy a specific game’s art,
camera, maps, menus, characters, or effects.

## Current visual foundation

Save v12 currently uses:

- small code-authored pixel arrays for Buddies;
- a customizable pixel trainer;
- CSS-rendered world tiles and route nodes;
- DOM panels for maps, workouts, captures, index, log, and settings;
- gym-specific colors, icons, and mood labels;
- trainer emotes;
- workout, stress, meter, and boss-state animation; and
- responsive layouts for narrower screens.

The game is not currently a canvas or tile-engine runtime. Art plans must not
assume a renderer migration.

## Visual pillars

### Athletic silhouettes

Buddies should communicate weight distribution, stance, reach, shell, horns,
wings, posture, or grip shape at a glance. Silhouette comes before surface
detail.

### Machine culture

Each gym’s equipment should tell the player what that location values:
recovery, control, drive, durability, precision, or maximum pressure.

### Pressure made visible

Arm-wrestling meter changes, machine alignment, spot risk, fatigue, and boss
overload need distinct shapes, labels, and motion patterns.

### Trainer expression

The trainer should remain identifiable after customization. Color changes,
body-profile visualization, facing, and emotes should support player
ownership.

## Pixel-art rules

- Use original silhouettes and hand-authored or internally generated pixels.
- Establish a project-owned base grid and scaling policy before new asset
  production.
- Preserve hard edges at integer scale when possible.
- Limit each character palette intentionally.
- Use contrast to separate body, face, equipment, and active effect.
- Avoid borrowing poses, proportions, idle cycles, outlines, palettes, or
  sprite-sheet layouts from existing games.
- Record source and author for every shipped asset.

**Needs validation:** standard Buddy sprite dimensions, trainer sprite
dimensions, animation frame counts, and whether code-authored arrays remain
the production format.

## Gym palette direction

| Gym | Suggested visual character | Current basis |
|---|---|---|
| Home | Cool calm neutrals with recovery highlights | Calm baseline |
| Starter A | Clean training-floor blues/greens and momentum accents | Steady overload |
| Starter B | Denser control colors and grip-warning accents | Tension |
| Iron | Dark metal, worn plates, controlled sparks | First gauntlet |
| Apex | High-contrast precision lighting and forge heat | Mythic trials |
| Glory | Ceremonial athletic golds with maximum-pressure contrast | Dominance |

These are palette directions, not fixed color values.

## Interface direction

- Keep text-heavy HUD and menus in accessible DOM surfaces.
- Preserve the playfield’s readability by grouping secondary details.
- Keep the control meter, spot window, route exits, fatigue, and required
  machine visible at decision time.
- Use original panel composition rather than reproducing a familiar
  creature-RPG menu layout.
- Use consistent button hierarchy across workout, travel, and capture.
- Provide selected, focused, disabled, danger, and success states.

## Animation language

- **Ready:** controlled pulse or lift.
- **Strain:** measured shake with a text label.
- **Danger:** sharper interruption, never motion alone.
- **Overload:** high urgency with reduced-motion equivalent.
- **Victory:** brief trainer/Buddy celebration.
- **Travel:** directional shift and route transition.

Animation should be short and functional. Avoid constant screen noise.

## Audio relationship

The current score is synthesized through Web Audio with home, exploration,
fight, and boss profiles. Visual timing may coordinate with original audio
cues, but no animation should require sound to understand.

Do not reproduce copyrighted melodies, instrumentation signatures, or sound
effects. See [IP Originality Guide](./IP_ORIGINALITY_GUIDE.md).

## Accessibility

- Meet readable text and contrast targets on supported screens.
- Never encode route access, fatigue, boss alignment, or workout risk by color
  alone.
- Support reduced motion.
- Keep touch controls large and separated.
- Maintain visible keyboard focus.
- Avoid high-frequency flashing.
- Provide mute and separate music/SFX volume, as v12 currently does.
- **Needs validation:** minimum text size, high-contrast theme, palette
  presets, and screen-reader labeling standards.

## Asset review checklist

Before accepting an asset:

1. Is the silhouette original?
2. Can it be read at intended size?
3. Does it fit one gym or Buddy discipline?
4. Does it avoid protected characters, poses, palettes, icons, and layouts?
5. Is authorship/source recorded?
6. Does it have a reduced-motion or static presentation where required?
7. Does it remain clear without audio and without color?
8. Has it been tested on desktop and a touch-sized viewport?
