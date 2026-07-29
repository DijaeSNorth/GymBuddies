# Gym Buddies Game Vision

## Document status

This document defines the product direction for the protected save-v12
prototype. It does not replace current rules. Statements labeled **Current**
describe working v12 behavior. Statements labeled **Needs validation** are
design decisions that must be playtested before implementation.

## Player fantasy

> Build a customized trainer, explore a connected fitness world, train
> original Gym Buddies, challenge specialized gyms, capture creatures through
> competitive arm-wrestling encounters, and develop a balanced team through
> Power, Technique, Endurance, Mobility, and Recovery.

The player should feel like a coach, athlete, explorer, and team builder. The
fantasy is not simply becoming stronger. It is learning when to push, when to
recover, which training environment fits each Buddy, and how to prepare a
balanced team for increasingly demanding gyms.

## Product identity

Gym Buddies is an original, browser-first, pixel-art fitness RPG with:

- a customizable trainer whose body profile affects preparation;
- a connected six-gym world rather than a menu-only level list;
- original creatures developed through workouts and recovery;
- competitive arm-wrestling encounters used for capture;
- machine-specific boss challenges;
- fatigue as a resource to manage, not just a punishment; and
- short playable actions that feed a longer team-building journey.

The current implementation is a React-driven 2D interface with pixel sprites,
DOM-based panels, local saves, keyboard and touch/click controls, and
synthesized Web Audio. A future renderer change is not assumed by this vision.

## Experience pillars

### 1. Your trainer is part of the team

Trainer creation is a meaningful opening step. Name, visual colors, muscle
profile, and physique establish identity and influence training preparation.
The trainer should remain visible and expressive throughout the journey.

### 2. Preparation creates advantage

Machine choice, Buddy condition, workout quality, fatigue, and recovery shape
capture readiness. Progress should reward informed preparation rather than
repetitive clicking alone.

### 3. The world is connected

Home Gym, the starter gyms, and the higher gyms form a route journey. Movement
should communicate distance, risk, fatigue, scouting opportunity, and the
feeling of reaching a more demanding training culture.

### 4. Every Buddy has a training story

Buddies are original characters with recognizable silhouettes, athletic
personalities, and distinct preparation profiles. Their growth is expressed
through level, HP, Form, Mobility, and Volume in v12.

The five desired team disciplines—Power, Technique, Endurance, Mobility, and
Recovery—should guide future roster and encounter design. **Needs validation:**
whether these become explicit stats, derived roles, tags, or player-facing
recommendations.

### 5. Capture is a contest

Capture is earned through an arm-wrestling pressure match, not through a
thrown object. Move choice, preparation, machine alignment, fatigue, and
control-meter performance create the capture opportunity.

### 6. Recovery is progress

Resting is an intentional choice. Recovery should help the player learn
sustainable team development, provide comeback paths, and prevent failure
from becoming a dead end.

## Target emotional arc

1. **Ownership:** “This is my trainer and my starting team.”
2. **Curiosity:** “What is down this route, and what can appear here?”
3. **Practice:** “This machine can prepare my Buddy for the next challenge.”
4. **Tension:** “The rep is slipping; I need to spot it.”
5. **Competition:** “I can take control of this arm-wrestling match.”
6. **Relief:** “The capture held.”
7. **Mastery:** “My balanced preparation beat a specialized boss.”
8. **Pride:** “My team reflects how I chose to train and recover.”

## Audience and play pattern

The game should be understandable to players who enjoy collection,
progression, light strategy, and fitness-themed humor without requiring
fitness expertise.

**Needs validation:**

- target age rating and the presentation of supplement-related content;
- ideal first-session and repeat-session length;
- whether the primary audience prefers relaxed collection, strategic
  optimization, or equal emphasis;
- how much numerical detail should be visible by default; and
- whether longer sessions need explicit pause or suspend support.

## Non-goals

- Recreating any existing creature-collection franchise, combat system, map,
  interface, story structure, or visual identity.
- Using real-world exercise advice as medical or training instruction.
- Punishing players for real bodies, fitness levels, disabilities, or
  preferred play styles.
- Requiring online accounts or multiplayer for the core journey.
- Replacing the current working game wholesale before characterization tests
  exist.

## Success principles

Gym Buddies is succeeding when:

- players can explain why they selected a machine or chose to recover;
- different Buddies invite different preparation choices;
- route travel creates anticipation without wasting time;
- bosses test learned systems rather than hidden rules;
- failed workouts and captures provide clear recovery paths;
- controls remain usable across desktop and touchscreen;
- important information is not communicated by color alone; and
- every name, creature, sound, visual, and story element is recognizably
  original.

## Related documents

- [Core Game Loop](./CORE_GAME_LOOP.md)
- [Progression Design](./PROGRESSION_DESIGN.md)
- [Content Bible](./CONTENT_BIBLE.md)
- [IP Originality Guide](./IP_ORIGINALITY_GUIDE.md)
- [Roadmap](./ROADMAP.md)
