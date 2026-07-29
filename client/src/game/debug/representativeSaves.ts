import type { SaveData } from '../types';
import { TUTORIAL_STEPS } from '../content/tutorial';
import { createDefaultSaveData } from '../save/saveDefaults';

export type RepresentativeTestSave = {
  id: string;
  label: string;
  description: string;
  json: string;
};

export function createRepresentativeTestSaves(
  base: SaveData = createDefaultSaveData(),
): RepresentativeTestSave[] {
  const {
    accessibility: _accessibility,
    input: _input,
    schemaVersion: _schemaVersion,
    ...legacyState
  } = base;
  const v12 = {
    ...legacyState,
    version: 'v12',
  };
  const progressed = {
    ...base,
    hasStarterSet: true,
    activeZoneId: 'higher-1',
    unlockedZoneIds: [
      'home',
      'starter-a',
      'starter-b',
      'higher-1',
      'higher-2',
    ],
    visitedZoneIds: [
      'home',
      'starter-a',
      'starter-b',
      'higher-1',
    ],
    trainingFatigue: 54,
    workoutMomentum: 17,
    deloadTokens: 2,
    seenDex: Array.from({ length: 10 }, (_, index) => index + 1),
    caughtDex: Array.from({ length: 7 }, (_, index) => index + 1),
    tutorialStep: TUTORIAL_STEPS.length,
    bossGameplayTimeMs: 620_000,
  } satisfies SaveData;

  return [
    {
      id: 'representative.current-new',
      label: 'Current New Journey',
      description: 'A valid schema-15 save at the opening.',
      json: JSON.stringify(base, null, 2),
    },
    {
      id: 'representative.current-progressed',
      label: 'Current Mid-Journey',
      description:
        'A valid progressed schema-15 save with fatigue, unlocks, and Index data.',
      json: JSON.stringify(progressed, null, 2),
    },
    {
      id: 'representative.v12-complete',
      label: 'Complete v12',
      description:
        'The complete legacy prototype shape for migration testing.',
      json: JSON.stringify(v12, null, 2),
    },
    {
      id: 'representative.v12-partial',
      label: 'Partial v12',
      description:
        'A recoverable v12 save with missing fields and a legacy wall-clock boss timer.',
      json: JSON.stringify(
        {
          version: 'v12',
          trainer: v12.trainer,
          team: v12.team.slice(0, 1),
          activeZoneId: 'starter-a',
          bossSchedules: {
            'starter-a': {
              nextBossAt: Number.MAX_SAFE_INTEGER,
              defeated: 2,
            },
          },
          audio: {
            enabled: false,
            musicVolume: 0.25,
          },
        },
        null,
        2,
      ),
    },
    {
      id: 'representative.corrupted',
      label: 'Corrupted JSON',
      description:
        'An intentionally truncated document for recovery-path testing.',
      json: '{"version":"v12","trainer":',
    },
  ];
}
