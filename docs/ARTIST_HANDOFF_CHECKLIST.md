# Gym Buddies Artist Handoff Checklist

Use this checklist for every authored Buddy species, boss variant, or modular
layer set.

## Identity and originality

- [ ] Species stable ID is recorded.
- [ ] Character name and anatomy family are recorded.
- [ ] Protected silhouette features are listed.
- [ ] The design is original and does not copy or trace a recognizable
      creature, mascot, anime, comic, wrestling, or video-game character.
- [ ] No protected creature-collection names, logos, interface frames, map
      language, or signature color layout are present.
- [ ] No real athlete, organization, gym brand, sponsor, or product is
      referenced.
- [ ] Source references and their usage rights are recorded.

## Canvas and anchoring

- [ ] Every runtime frame is 24×24 RGBA.
- [ ] Pivot is bottom-center `(12, 21)`.
- [ ] Ground contact is on or above y 21.
- [ ] Top, left, and right have at least one transparent pixel of margin.
- [ ] No pixels are cropped.
- [ ] Scale is consistent across the entire strip.
- [ ] The full raster is not stretched to create physique variants.

## Directions

- [ ] Front is complete.
- [ ] Back is complete.
- [ ] Left is complete.
- [ ] Right is complete, or safe left-to-right mirroring is explicitly approved.
- [ ] One-sided markings, scars, horns, fins, tools, logos, or accessories are
      listed in `asymmetricFeatureIds`.
- [ ] Back-facing anatomy shows the intended back, shell, wing, or posterior
      emphasis.

## States

- [ ] Idle frames 0–1.
- [ ] Walking frames 2–3.
- [ ] Running frames 4–5.
- [ ] Training frames 6–7.
- [ ] Fatigue frames 8–9.
- [ ] Capture frames 10–11.
- [ ] Victory frames 12–13.
- [ ] Front flex frames 14–15.
- [ ] Back flex frames 16–17.
- [ ] Side pose frames 18–19.
- [ ] Boss entrance frames 20–21.
- [ ] Rare entrance frames 22–23.
- [ ] Every state is readable at 1×.
- [ ] Timing matches the manifest or has a reviewed override.

## Customization

- [ ] Compact preset remains species-identifiable.
- [ ] Balanced preset remains species-identifiable.
- [ ] Broad preset remains species-identifiable.
- [ ] Specialized preset remains species-identifiable.
- [ ] Species-specific fifth preset remains species-identifiable.
- [ ] Primary, secondary, detail, and accent marker regions are intentional.
- [ ] Markings align in every direction.
- [ ] Appendage replacements use declared anchors.
- [ ] Equipment and accessories do not detach.
- [ ] Expressions remain readable.
- [ ] Pump and rare effects do not erase the silhouette.

## Layer delivery

- [ ] `shadow`
- [ ] `base-body`
- [ ] `physique-overlay`
- [ ] `appendage-variant`
- [ ] `marking`
- [ ] `equipment`
- [ ] `accessory`
- [ ] `expression`
- [ ] `pump`
- [ ] `rare-trait`
- [ ] `boss-tier`, when applicable

Unused layers must be documented rather than filled with duplicate art.
Every delivered layer uses the same frame order, canvas, pivot, and ground line.

## Boss delivery

- [ ] Normal tier is distinct.
- [ ] Pumped tier is distinct.
- [ ] Overload tier is distinct.
- [ ] Final-round tier is distinct.
- [ ] Defeated tier is tired/respectful rather than graphically injured.
- [ ] Tier changes use posture, definition, equipment, effects, or lighting—not
      only sprite scale.
- [ ] All five tiers stay in bounds.

## File and manifest delivery

- [ ] Filenames use lowercase stable IDs.
- [ ] Asset keys use `buddy.<species-id>.authored.<direction>` or the approved
      boss form.
- [ ] Runtime PNG is under
      `client/public/assets/gym-buddies/buddies/handcrafted/`.
- [ ] Non-runtime references are under `client/art-source/`.
- [ ] Manifest renderer mode is correct.
- [ ] Anatomy family is correct.
- [ ] Directional keys are correct.
- [ ] Mirror policy is correct.
- [ ] Fallback is `procedural`.
- [ ] Asset status is `review` until final approval.

## Validation and review

- [ ] `npm run sprites:validate`
- [ ] `npm run assets:validate`
- [ ] `npm run typecheck`
- [ ] Focused sprite-pipeline unit tests
- [ ] Sprite Strip Lab review at 1×, 2×, 4×, and 6×
- [ ] Light background check
- [ ] Dark background check
- [ ] Checkerboard transparency check
- [ ] 240×160 mobile-context check
- [ ] Procedural fallback check
- [ ] React/Phaser frame receipt check
- [ ] Production build
- [ ] Human art-direction approval
