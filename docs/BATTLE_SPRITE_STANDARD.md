# Gym Buddies Battle Sprite Standard

## Resolution

Standard capture battles use 48×48 logical RGBA frames. Major bosses may use
64×64 when the additional pixels communicate equipment, expression, and tier
state that would not remain readable at 48×48.

Sprites remain nearest-neighbor at integer display scales. They are authored
for their target frame and must not be enlarged copies of 24×24 overworld art.

## Frame order

Every battle row contains these twelve frames:

1. `neutral-battle`
2. `attack-preparation`
3. `shoulder-burst`
4. `iron-grind`
5. `snapping-hook`
6. `counter`
7. `stamina-loss`
8. `near-pin`
9. `victory`
10. `capture-success`
11. `escape`
12. `defeat`

The standard pilot sheets use one authored frame per pose. Runtime impact,
hit-stop, and transitions remain separate presentation effects.

## Boss rows

A tiered boss battle sheet contains one twelve-frame row for each state:

1. normal
2. pumped
3. overload
4. final-round
5. defeated

Tier changes must preserve the same character. Use posture, equipment,
definition, expression, breathing, markings, and controlled effects rather
than uniform sprite scaling.

## Composition

- Anchor: bottom-center.
- Ground line: frame height minus three pixels.
- Safe border: at least one transparent pixel on every edge.
- Primary silhouette should occupy roughly 65–85% of frame height.
- Hands, muzzle, fins, tail, ears, wraps, belts, and other identity features
  stay attached in every pose.
- Strong move arcs must not obscure the face or contact limb.
- Defeat remains respectful and non-graphic.

## Cosmetic slots

Battle bases use the same exact marker colors as overworld art. Cosmetics are
applied from the same stable Buddy profile; battle art cannot introduce a
second palette, preset, marking, or accessory identity.

## Acceptance

- all twelve frames are present and non-empty;
- no frame crosses its declared ground line or safe border;
- the character remains identifiable in silhouette;
- each move pose has a distinct alpha signature;
- player cosmetics resolve identically in React and Phaser;
- missing battle art selects a lower-resolution or hybrid fallback safely;
- battle assets are absent from initial decoded-image and network receipts.
