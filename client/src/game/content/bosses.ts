import type {
  BossArenaEffect,
  BossRewardTable,
  BossSignatureRule,
  CaptureMoveId,
  GymBoss,
  GymBossRoster,
} from '../types';
import { DEFAULT_BOSS_GYM_ID } from './gyms';

export const BOSS_MIN_MS = 5 * 60 * 1000;
export const BOSS_MAX_MS = 10 * 60 * 1000;
export const BOSS_LEGACY_MIGRATION_GRACE_MS = 60 * 1000;

function signature(
  id: string,
  name: string,
  description: string,
  warning: string,
  trigger: BossSignatureRule['trigger'],
  requiredMoveId: CaptureMoveId,
  balance: Pick<
    BossSignatureRule,
    | 'openingMeterShift'
    | 'meterShift'
    | 'fatigueShift'
    | 'targetShift'
    | 'stressShift'
  >,
): BossSignatureRule {
  return {
    id,
    name,
    description,
    warning,
    trigger,
    requiredMoveId,
    ...balance,
  };
}

function arena(
  id: string,
  name: string,
  description: string,
  className: string,
): BossArenaEffect {
  return { id, name, description, className };
}

function rewards(
  id: string,
  buddyXp: number,
  fatigueRecovery: number,
  momentum: number,
  deloadTokens: number,
  bonusDeloadChance: number,
): BossRewardTable {
  return {
    id,
    buddyXp,
    fatigueRecovery,
    momentum,
    deloadTokens,
    bonusDeloadChance,
  };
}

export const BOSS_ROSTERS: GymBossRoster[] = [
  {
    id: 'boss-roster-home',
    gymId: 'home',
    bosses: [
      {
        id: 'home-watchman',
        name: 'Bramblift Mat Watchman',
        speciesId: 'brawny-bear',
        levelShift: 4,
        catchMultiplier: 0.7,
        powerBoost: 9,
        personality:
          'Patient and encouraging, but unwilling to reward rushed technique.',
        visualIdentity:
          'Moss wrist wraps, a square cedar badge, and a low anchored stance.',
        preferredTactic: 'grind',
        counterplay:
          'Use Shoulder Burst from the required machine before the Watchman settles.',
        signatureRule: signature(
          'rule-rooted-opening',
          'Rooted Opening',
          'The Watchman begins with a small control lead, then fights by ordinary challenge rules.',
          'Expect an anchored opening; recover the early meter with the required action.',
          'opening',
          'burst',
          {
            openingMeterShift: -4,
            meterShift: -1,
            fatigueShift: 0,
            targetShift: -2,
            stressShift: -4,
          },
        ),
        arenaEffect: arena(
          'arena-moss-ring',
          'Moss Ring',
          'Soft green edge lights mark the safe control lane.',
          'moss-ring',
        ),
        rewardTable: rewards('reward-home-watchman', 8, 10, 3, 0, 0.15),
      },
      {
        id: 'home-librarian',
        name: 'Rippleweld Desk Warden',
        speciesId: 'buff-otter',
        levelShift: 3,
        catchMultiplier: 0.7,
        powerBoost: 7,
        personality:
          'Curious and observant, cataloguing every repeated choice with a playful chirp.',
        visualIdentity:
          'Blue chalk marks, a brass note clip, and a constantly shifting elbow angle.',
        preferredTactic: 'snap',
        counterplay:
          'Rotate into Iron Grind and avoid repeating the same move twice.',
        signatureRule: signature(
          'rule-margin-notes',
          'Margin Notes',
          'Repeating a move lets the Warden annotate the pattern and steal extra control.',
          'Repeated moves trigger an additional control penalty.',
          'player-repeat',
          'grind',
          {
            openingMeterShift: 0,
            meterShift: -3,
            fatigueShift: 1,
            targetShift: -1,
            stressShift: 2,
          },
        ),
        arenaEffect: arena(
          'arena-blueprint-grid',
          'Blueprint Grid',
          'Thin blue guide lines clarify meter movement and machine alignment.',
          'blueprint-grid',
        ),
        rewardTable: rewards('reward-home-librarian', 9, 12, 2, 0, 0.2),
      },
    ],
  },
  {
    id: 'boss-roster-starter-a',
    gymId: 'starter-a',
    bosses: [
      {
        id: 'a-rhino',
        name: 'Railhorn Bench Marshal',
        speciesId: 'ripped-rhino',
        levelShift: 7,
        catchMultiplier: 0.62,
        powerBoost: 14,
        personality:
          'Direct, loud, and respectful of anyone who keeps composure under pressure.',
        visualIdentity:
          'A riveted brow guard, orange lane stripes, and a forward-driving silhouette.',
        preferredTactic: 'burst',
        counterplay:
          'Save Snapping Hook for the Marshal’s committed drive and protect stamina.',
        signatureRule: signature(
          'rule-redline-reserve',
          'Redline Reserve',
          'Low team stamina gives the Marshal a stronger finishing drive.',
          'Below 36 stamina, the Marshal gains additional control pressure.',
          'low-stamina',
          'snap',
          {
            openingMeterShift: -1,
            meterShift: -4,
            fatigueShift: 2,
            targetShift: 1,
            stressShift: 5,
          },
        ),
        arenaEffect: arena(
          'arena-rail-lights',
          'Rail Lights',
          'Orange rail lights pulse once when stamina enters the danger range.',
          'rail-lights',
        ),
        rewardTable: rewards('reward-a-rhino', 15, 8, 5, 0, 0.25),
      },
      {
        id: 'a-bison',
        name: 'Cairnox Redline',
        speciesId: 'boulder-bison',
        levelShift: 8,
        catchMultiplier: 0.58,
        powerBoost: 16,
        personality:
          'Stoic and exacting, treating the assigned machine as part of the oath.',
        visualIdentity:
          'Stone-gray shoulder plates, a red center stripe, and heavy planted hooves.',
        preferredTactic: 'grind',
        counterplay:
          'Stay on the announced machine and break the anchor with Shoulder Burst.',
        signatureRule: signature(
          'rule-lane-oath',
          'Lane Oath',
          'Using the wrong machine sharply increases fatigue and control loss.',
          'Machine mismatch is especially punishing in this challenge.',
          'machine-mismatch',
          'burst',
          {
            openingMeterShift: -2,
            meterShift: -4,
            fatigueShift: 3,
            targetShift: 2,
            stressShift: 8,
          },
        ),
        arenaEffect: arena(
          'arena-redline-floor',
          'Redline Floor',
          'A restrained red floor stripe highlights the assigned station.',
          'redline-floor',
        ),
        rewardTable: rewards('reward-a-bison', 17, 7, 6, 1, 0.1),
      },
    ],
  },
  {
    id: 'boss-roster-starter-b',
    gymId: 'starter-b',
    bosses: [
      {
        id: 'b-wolf',
        name: 'Rivetjack Counter',
        speciesId: 'iron-wolf',
        levelShift: 9,
        catchMultiplier: 0.55,
        powerBoost: 18,
        personality:
          'Restless and clever, waiting for the exact moment a player nears the pin line.',
        visualIdentity:
          'Silver ear guards, violet wrist tape, and a narrow counter-ready stance.',
        preferredTactic: 'snap',
        counterplay:
          'Build with Iron Grind early; do not arrive at the target without the required streak.',
        signatureRule: signature(
          'rule-pinline-feint',
          'Pinline Feint',
          'Approaching secure control without a complete streak triggers a late counter.',
          'Near the target, an incomplete streak costs extra control.',
          'near-target',
          'grind',
          {
            openingMeterShift: 0,
            meterShift: -4,
            fatigueShift: 1,
            targetShift: 2,
            stressShift: 6,
          },
        ),
        arenaEffect: arena(
          'arena-violet-ticks',
          'Violet Ticks',
          'Violet target ticks make the late counter window visible.',
          'violet-ticks',
        ),
        rewardTable: rewards('reward-b-wolf', 20, 8, 7, 0, 0.35),
      },
      {
        id: 'b-boar',
        name: 'Kettusk Prime',
        speciesId: 'muscled-boar',
        levelShift: 8,
        catchMultiplier: 0.56,
        powerBoost: 17,
        personality:
          'Boisterous and generous, rewarding bold technique performed with discipline.',
        visualIdentity:
          'Copper tusk caps, teal grip tape, and a compact spring-loaded posture.',
        preferredTactic: 'burst',
        counterplay:
          'Land Snapping Hook on the required machine to turn the Prime’s momentum.',
        signatureRule: signature(
          'rule-clean-turn',
          'Clean Turn',
          'A correct machine-and-move action earns a small extra meter reward.',
          'The complete required action is more valuable than machine alignment alone.',
          'required-action',
          'snap',
          {
            openingMeterShift: -2,
            meterShift: 3,
            fatigueShift: -1,
            targetShift: 1,
            stressShift: -6,
          },
        ),
        arenaEffect: arena(
          'arena-copper-sparks',
          'Copper Sparks',
          'Small copper edge sparks celebrate complete required actions.',
          'copper-sparks',
        ),
        rewardTable: rewards('reward-b-boar', 19, 10, 6, 1, 0.15),
      },
    ],
  },
  {
    id: 'boss-roster-higher-1',
    gymId: 'higher-1',
    bosses: [
      {
        id: 'h1-gryphon',
        name: 'Prismantle Sentinel',
        speciesId: 'prismantle',
        levelShift: 12,
        catchMultiplier: 0.52,
        powerBoost: 22,
        personality:
          'Formal and theatrical, saving its sharpest read for the closing exchange.',
        visualIdentity:
          'Prismatic shoulder feathers, black iron bands, and a high poised wrist.',
        preferredTactic: 'snap',
        counterplay:
          'Complete the Iron Grind streak before the final round begins.',
        signatureRule: signature(
          'rule-closing-fan',
          'Closing Fan',
          'The final round carries extra control and fatigue pressure.',
          'Entering the last round without control is especially dangerous.',
          'final-round',
          'grind',
          {
            openingMeterShift: -2,
            meterShift: -5,
            fatigueShift: 2,
            targetShift: 3,
            stressShift: 7,
          },
        ),
        arenaEffect: arena(
          'arena-prism-shutters',
          'Prism Shutters',
          'Edge shutters narrow visually as the final round approaches.',
          'prism-shutters',
        ),
        rewardTable: rewards('reward-h1-gryphon', 27, 9, 8, 1, 0.25),
      },
      {
        id: 'h1-gorilla',
        name: 'Manyfold Relay',
        speciesId: 'manyfold',
        levelShift: 11,
        catchMultiplier: 0.5,
        powerBoost: 24,
        personality:
          'Methodical and unflappable, escalating whenever the challenger fully loses the pattern.',
        visualIdentity:
          'Layered relay bands, cobalt knuckle wraps, and a broad symmetrical frame.',
        preferredTactic: 'grind',
        counterplay:
          'Use Shoulder Burst on the assigned station; partial alignment still counts as a near miss.',
        signatureRule: signature(
          'rule-broken-relay',
          'Broken Relay',
          'A complete machine-and-move miss adds an extra control penalty.',
          'Missing both requirements accelerates the Relay.',
          'miss',
          'burst',
          {
            openingMeterShift: -3,
            meterShift: -4,
            fatigueShift: 2,
            targetShift: 3,
            stressShift: 9,
          },
        ),
        arenaEffect: arena(
          'arena-cobalt-relay',
          'Cobalt Relay',
          'Cobalt bands show whether machine and move requirements are linked.',
          'cobalt-relay',
        ),
        rewardTable: rewards('reward-h1-gorilla', 29, 7, 9, 1, 0.3),
      },
    ],
  },
  {
    id: 'boss-roster-higher-2',
    gymId: 'higher-2',
    bosses: [
      {
        id: 'h2-hydra',
        name: 'Vaultwyrm Arch',
        speciesId: 'vaultwyrm',
        levelShift: 13,
        catchMultiplier: 0.5,
        powerBoost: 25,
        personality:
          'Proud and relentless until its own stamina dips, then suddenly precise.',
        visualIdentity:
          'Three arched neck plates, ember seams, and a forward coiled grip.',
        preferredTactic: 'burst',
        counterplay:
          'Use Snapping Hook while preserving enough stamina for the Arch’s late adjustment.',
        signatureRule: signature(
          'rule-second-wind-arch',
          'Second-Wind Arch',
          'When the boss drops below 36 stamina, it gains a compact control surge.',
          'Low boss stamina is a warning, not a free finish.',
          'opponent-low-stamina',
          'snap',
          {
            openingMeterShift: -3,
            meterShift: -5,
            fatigueShift: 1,
            targetShift: 4,
            stressShift: 7,
          },
        ),
        arenaEffect: arena(
          'arena-ember-arches',
          'Ember Arches',
          'Dim ember arches brighten only when the boss enters its second wind.',
          'ember-arches',
        ),
        rewardTable: rewards('reward-h2-hydra', 32, 8, 10, 1, 0.35),
      },
      {
        id: 'h2-manticore',
        name: 'Crownquill Brace',
        speciesId: 'crownquill',
        levelShift: 12,
        catchMultiplier: 0.48,
        powerBoost: 27,
        personality:
          'Exacting and sly, exploiting challengers who satisfy only half the announced pattern.',
        visualIdentity:
          'Gold quill crown, plum bracers, and a sideways reading posture.',
        preferredTactic: 'snap',
        counterplay:
          'Pair Iron Grind with the exact machine; machine-only or move-only attempts feed the Brace.',
        signatureRule: signature(
          'rule-half-measure',
          'Half Measure',
          'Near misses apply a special fatigue tax even when one requirement was correct.',
          'Partial alignment is readable but costly.',
          'near-miss',
          'grind',
          {
            openingMeterShift: -2,
            meterShift: -3,
            fatigueShift: 3,
            targetShift: 4,
            stressShift: 8,
          },
        ),
        arenaEffect: arena(
          'arena-quill-brackets',
          'Quill Brackets',
          'Gold brackets frame the two-part machine-and-move requirement.',
          'quill-brackets',
        ),
        rewardTable: rewards('reward-h2-manticore', 34, 10, 9, 1, 0.4),
      },
    ],
  },
  {
    id: 'boss-roster-higher-3',
    gymId: 'higher-3',
    bosses: [
      {
        id: 'h3-pegasus',
        name: 'Manyfold Summit',
        speciesId: 'manyfold',
        levelShift: 14,
        catchMultiplier: 0.48,
        powerBoost: 28,
        personality:
          'Calm at first, then intensely focused when challenge stress begins to climb.',
        visualIdentity:
          'White summit bands, indigo plates, and a tall immovable center line.',
        preferredTactic: 'grind',
        counterplay:
          'Finish the Shoulder Burst requirement early and keep stress below danger.',
        signatureRule: signature(
          'rule-summit-pressure',
          'Summit Pressure',
          'Danger-level stress gives the Summit additional meter pressure.',
          'At 70% stress, the arena enters its summit phase.',
          'high-stress',
          'burst',
          {
            openingMeterShift: -4,
            meterShift: -5,
            fatigueShift: 2,
            targetShift: 5,
            stressShift: 10,
          },
        ),
        arenaEffect: arena(
          'arena-summit-halo',
          'Summit Halo',
          'An indigo edge halo intensifies at high stress without covering the meter.',
          'summit-halo',
        ),
        rewardTable: rewards('reward-h3-pegasus', 39, 10, 11, 1, 0.5),
      },
      {
        id: 'h3-pegas',
        name: 'Prismantle Zenith',
        speciesId: 'prismantle',
        levelShift: 15,
        catchMultiplier: 0.45,
        powerBoost: 30,
        personality:
          'Radiant and severe, turning overload into a final test of deliberate recovery.',
        visualIdentity:
          'A sharp aurora crest, midnight wraps, and a brilliant angular silhouette.',
        preferredTactic: 'burst',
        counterplay:
          'Answer with Snapping Hook and never allow both machine and move discipline to collapse.',
        signatureRule: signature(
          'rule-zenith-overload',
          'Zenith Overload',
          'An overloaded challenge applies the largest fatigue and control penalty in the journey.',
          'Overload must be prevented; the required action is the only stable reset.',
          'overload',
          'snap',
          {
            openingMeterShift: -5,
            meterShift: -6,
            fatigueShift: 4,
            targetShift: 6,
            stressShift: 12,
          },
        ),
        arenaEffect: arena(
          'arena-aurora-zenith',
          'Aurora Zenith',
          'A restrained aurora border shifts color with challenge stress.',
          'aurora-zenith',
        ),
        rewardTable: rewards('reward-h3-pegas', 44, 12, 12, 2, 0.35),
      },
    ],
  },
];

export const GYM_BOSSES = Object.fromEntries(
  BOSS_ROSTERS.map((roster) => [roster.gymId, roster.bosses]),
);

export const BOSS_BY_ID = new Map(
  BOSS_ROSTERS.flatMap((roster) => roster.bosses).map((boss) => [
    boss.id,
    boss,
  ]),
);

export function getBossesForGym(gymId: string) {
  return GYM_BOSSES[gymId] ?? GYM_BOSSES[DEFAULT_BOSS_GYM_ID] ?? [];
}

export function getBossById(bossId: string | undefined): GymBoss | null {
  return bossId ? BOSS_BY_ID.get(bossId) ?? null : null;
}
