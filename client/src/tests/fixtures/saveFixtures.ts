import { TUTORIAL_STEPS } from '../../game/content/tutorial';
import { SAVE_BACKUP_KEY, SAVE_KEY, TEAM_SIZE } from '../../game/content/save';
import { createRepresentativeTestSaves } from '../../game/debug/representativeSaves';
import { createDefaultSaveData } from '../../game/save/saveDefaults';
import { exportSaveJson } from '../../game/save/saveService';
import type { SaveData } from '../../game/types';

const FIXTURE_DATE = new Date('2026-01-15T12:00:00.000Z');

function cloneBuddyForSlot(
  buddy: SaveData['team'][number],
  index: number,
): SaveData['team'][number] {
  return {
    ...buddy,
    id: `fixture-party-${index + 1}`,
    nickname: `Fixture ${index + 1}`,
  };
}

export function createStartedJourneyFixture(
  trainerName = 'Avery',
): SaveData {
  const save = createDefaultSaveData({
    accessibility: {
      reducedMotion: false,
      screenShake: true,
      highContrast: false,
      sustainedInputMode: 'hold',
      textSpeed: 'instant',
    },
    audio: {
      enabled: true,
      musicVolume: 0.5,
      sfxVolume: 0.82,
    },
  });
  return {
    ...save,
    hasStarterSet: true,
    tutorialStep: TUTORIAL_STEPS.length,
    trainer: {
      ...save.trainer,
      name: trainerName,
    },
  };
}

export function createRepresentativeSaveFixtures() {
  const currentNew = createDefaultSaveData({
    accessibility: {
      reducedMotion: false,
      screenShake: true,
      highContrast: false,
      sustainedInputMode: 'hold',
      textSpeed: 'instant',
    },
  });
  const started = createStartedJourneyFixture();
  const fullParty: SaveData = {
    ...started,
    team: Array.from({ length: TEAM_SIZE }, (_, index) =>
      cloneBuddyForSlot(started.team[index % started.team.length]!, index),
    ),
  };
  const starterBossReady: SaveData = {
    ...started,
    activeZoneId: 'starter-a',
    visitedZoneIds: ['home', 'starter-a'],
    bossGameplayTimeMs: 10_000,
    bossSchedules: {
      ...started.bossSchedules,
      'starter-a': {
        ...started.bossSchedules['starter-a']!,
        readyAtGameplayMs: 10_000,
      },
    },
  };
  const legacyEntry = createRepresentativeTestSaves(started).find(
    ({ id }) => id === 'representative.v12-complete',
  );
  if (!legacyEntry) {
    throw new Error('The complete v12 representative fixture is missing.');
  }
  const validBackup = createStartedJourneyFixture('Backup Avery');

  return {
    currentNew,
    started,
    fullParty,
    starterBossReady,
    legacyV12: JSON.parse(legacyEntry.json) as Record<string, unknown>,
    corruptedPrimary: '{"schemaVersion":14,"state":',
    validBackup,
    storage: {
      currentKey: SAVE_KEY,
      backupKey: SAVE_BACKUP_KEY,
      validBackupJson: exportSaveJson(validBackup, FIXTURE_DATE),
    },
  };
}
