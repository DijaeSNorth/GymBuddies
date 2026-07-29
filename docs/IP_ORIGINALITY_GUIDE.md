# IP and Originality Guide

## Purpose

Gym Buddies participates in the broad creature-collection RPG genre while
remaining an original work. GBA-era inspiration may guide pixel density,
clarity, and compact interaction, but all expressive content must belong to
Gym Buddies.

This document is a production policy, not legal advice.

## Core distinction

Gym Buddies is about:

- customized trainers;
- a connected fitness world;
- machine-based preparation;
- original Gym Buddies;
- fatigue and recovery;
- specialized athletic gyms; and
- captures earned through arm-wrestling pressure contests.

It is not a recreation, adaptation, clone, or unofficial entry in Pokémon or
any other existing franchise.

## Prohibited content

Do not use or imitate:

- Pokémon names, characters, creatures, silhouettes, evolutions, forms, or
  distinctive anatomy;
- Poké Balls or similar capture devices, their animations, or associated
  terminology;
- Pokémon sprites, tiles, maps, sounds, music, melodies, logos, fonts, color
  systems, badges, locations, dialogue, storylines, or UI layouts;
- “Poké,” “Dex,” “mon,” or confusingly similar brand constructions in
  player-facing naming;
- elemental type charts, move lists, or battle presentation copied from a
  specific franchise;
- a familiar professor/starter/rival/league narrative structure;
- copied gym-leader, badge-collection, four-command battle, or encounter
  screen composition;
- traced, recolored, kitbashed, or AI-remixed protected assets; or
- marketing language that implies affiliation, compatibility, or endorsement.

The generic words “trainer,” “gym,” “route,” “creature,” and “capture” may be
used when their expression is original and grounded in Gym Buddies’ fitness
identity.

## Player-facing terminology

Preferred terms include:

- Gym Buddy / Buddy
- Gym Buddy Index
- Capture Arena
- Arm-wrestling capture
- Scout
- Workout
- Spot
- Readiness
- Fatigue
- Momentum
- Deload
- Machine challenge
- Team

Internal v12 fields containing `dex` should remain implementation details
until they are safely refactored. Do not expose “Dex” as product branding.

## Current prototype review items

The protected v12 prototype includes comparison copy describing a
“Pokémon-style” world map. That wording should be removed in a later,
reviewed branding-only change. Its removal is not part of this documentation
task.

Current creatures, names, pixel arrays, dialogue, and synthesized music still
require the same provenance and similarity review as future content.

## Original-content rules

### Creatures

- Begin with a distinct athletic behavior and silhouette.
- Combine references through original design, not by modifying a known
  creature.
- Document inspiration at a broad level, such as real animal anatomy,
  mythology in the public domain, or exercise movement.
- Avoid signature color blocking, proportions, facial structures, or poses
  associated with protected characters.

### World

- Build gyms around original machine cultures and recovery philosophies.
- Keep route geography and names specific to Gym Buddies.
- Do not reproduce recognizable maps, town sequences, or landmark patterns.

### Interface

- Organize information around training, fatigue, machine alignment, and
  arm-wrestling pressure.
- Do not copy window frames, status layouts, fonts, iconography, battle
  commands, menus, or transitions.

### Audio

- Use original composition or generated synthesis owned for the project.
- Do not quote, interpolate, recreate, or closely evoke copyrighted melodies.
- Maintain source/project files or generation parameters where practical.
- Avoid copied sound-effect contours strongly associated with another game.

### Writing

- Use original names, dialogue, flavor, and story.
- Avoid references, catchphrases, plot beats, and jokes that depend on another
  franchise.
- Describe Gym Buddies on its own terms rather than through comparisons.

## Provenance record

Every shipped asset should record:

```text
Asset ID:
Asset type:
Author:
Creation date:
Source files:
Reference sources:
License/ownership:
AI assistance, if any:
Similarity review:
Approved by:
```

Do not ship an asset with unknown provenance.

## Similarity review

Review each new creature, environment, UI surface, sound, and name for:

- silhouette similarity;
- palette similarity;
- phonetic/name similarity;
- pose or animation similarity;
- composition and layout similarity;
- narrative-role similarity;
- sound or melodic similarity; and
- cumulative similarity across several individually generic choices.

If a reviewer’s first description is “the Gym Buddies version of [protected
character or feature],” redesign it.

## Marketing rules

- Lead with the fitness RPG and arm-wrestling capture identity.
- “GBA-inspired” may describe era-level pixel constraints.
- Do not use Pokémon in store copy, metadata, screenshots, tags, ads, or
  comparative slogans.
- Do not place Gym Buddies branding in a logo shape, type treatment, or color
  arrangement likely to cause confusion.

## Release gate

Before public release:

1. Audit all player-facing comparison language.
2. Review creature silhouettes and names.
3. Review UI screenshots beside leading genre titles.
4. Review all music and SFX provenance.
5. Confirm no protected assets exist in source, build output, documentation,
   or marketing.
6. Record approval for every shipped asset family.

**Needs validation:** who owns the formal originality approval role and
whether external legal review is required before commercial release.
