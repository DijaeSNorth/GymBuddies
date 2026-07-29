# Gym Buddies Content Bible

## Purpose

This bible protects the identity, tone, vocabulary, and internal consistency
of Gym Buddies. It records current save-v12 content separately from future
content that still needs validation.

## World premise

Gym Buddies takes place in a connected fitness world where trainers travel
between specialized gyms, develop original Buddies through machines and
recovery, scout new competitors, and earn captures through arm-wrestling
contests.

The world treats training as culture:

- Home Gym emphasizes safety, recovery, and fundamentals.
- Starter gyms introduce pressure, control, and sustainable effort.
- Higher gyms become distinct athletic institutions with stronger machines,
  rarer Buddies, and specialized bosses.

The current prototype does not define governments, cities, professions,
schools, a villain faction, or a world-saving plot. Those should not be
assumed.

## Canonical vocabulary

Use these player-facing terms:

| Term | Meaning |
|---|---|
| Trainer | The customized player character and coach |
| Gym Buddy / Buddy | An original collectible creature |
| Team | The active collection of up to six Buddies |
| Gym | A specialized training and encounter location |
| Route | A named connection between gyms |
| Machine | A workout station with focus, risk, and growth behavior |
| Workout / Set | A timed training action |
| Spot | The trainer’s timed attempt to save a failing set |
| Readiness | Preparedness derived from condition and training context |
| Fatigue | Global accumulated exertion |
| Momentum | Short-term benefit from quality workout rhythm |
| Deload | Recovery-earned capacity that reduces future load |
| Scout | Search for a wild Buddy |
| Capture Arena | The arm-wrestling encounter space |
| Boss Challenge | A timed specialized encounter with machine alignment |
| Gym Buddy Index | Player-facing seen/caught collection record |

Internal variable names such as `seenDex` are implementation legacy, not
player-facing brand vocabulary.

## Current six-gym journey

| Gym | Identity | Current accent |
|---|---|---|
| Home Gym | Calm preparation and recovery hall | Recovery |
| Starter Gym A | First pressure room and steady overload | Momentum |
| Starter Gym B | Control pit and grip discipline | Tension |
| Iron Gym | First higher-tier gauntlet | Grip war |
| Apex Gym | Precision forge and mythic trials | Resolve |
| Glory Gym | Highest current pressure deck | Dominance |

Current named routes:

- Warm Up Path
- Starter Link Road
- Iron Gate Trail
- Forge Stretch
- Champion Ascent

New location names should sound athletic, geographic, and specific to their
training culture. Avoid structures, names, or progression beats strongly
associated with another creature franchise.

## Current Buddy roster

The save-v12 foundation now defines sixteen polished original species: twelve
standard Buddies and four exotic Buddies. Each has a stable ID, primary and
optional secondary discipline, distinct silhouette and palette, complete base
profile, growth profile, capture difficulty, passive, signature move, animation
references, habitat, personality, role, and original flavor text.

The canonical roster is documented in [BUDDY_ROSTER.md](BUDDY_ROSTER.md).

## Buddy design principles

Every Buddy should have:

- a readable silhouette at a small pixel scale;
- an original name that fits the fitness-world tone;
- an athletic behavior or contest personality;
- a visual center of mass and recognizable arm-wrestling posture;
- a preparation strength and a meaningful weakness;
- a reason to choose it beyond raw level; and
- palette and animation choices distinct from all existing Buddies.

The five desired team disciplines can guide concepts:

- **Power:** explosive force and decisive meter movement.
- **Technique:** control, timing, alignment, and efficiency.
- **Endurance:** sustained performance across rounds or workouts.
- **Mobility:** consistency, repositioning, and recovery from drift.
- **Recovery:** resilience, HP restoration, and fatigue management.

**Resolved for the initial roster:** every species has one primary discipline
and may have one secondary discipline. These are content-level team roles
derived from the species profile; they do not add new persistent save stats.

## Buddy content template

Future species proposals should include:

```text
Species name:
Creature inspiration:
Original silhouette hook:
Athletic personality:
Primary discipline hypothesis:
Secondary discipline hypothesis:
Current-stat expression:
Capture behavior:
Workout preference:
Weakness or tradeoff:
Gym/route habitat:
Boss suitability:
Palette:
Animation notes:
Flavor text:
Originality review:
```

Do not assign implementation values until the concept passes content and
originality review.

## Trainer tone

The trainer is determined, expressive, and supportive. Feedback may be
playful and competitive, but it should not:

- shame bodies, weakness, fatigue, failure, or disability;
- treat recovery as cowardice;
- provide real medical advice;
- glamorize unsafe training; or
- make identity depend on one body shape.

Current trainer emotes cover neutral, focus, grind, pump, level, victory,
drained, and ready states.

## Dialogue style

- Short enough to read during play.
- Athletic and specific rather than generic fantasy exposition.
- Clear about cause and effect.
- Humorous without humiliating the player or Buddy.
- Confident during bosses, reassuring after failure.
- Written in original language without catchphrases from other media.

## Boss content

Current gyms each have two named boss variants. A boss combines:

- a title;
- an existing Buddy species;
- higher level pressure;
- catch scaling;
- power boost;
- challenge tier; and
- required machine.

Future bosses should express the current gym’s training philosophy. They
should not require unrelated lore to understand their mechanical test.

## Sensitive-content decisions

**Needs validation:**

- whether the current steroid term remains;
- age-rating and health-language review;
- whether crying/humiliation language in current victory copy fits the desired
  supportive tone;
- whether mythic animal inspirations need further visual differentiation; and
- whether all current boss/species pairings match their displayed titles.

These are content-review items, not authorization to change gameplay in the
documentation phase.
