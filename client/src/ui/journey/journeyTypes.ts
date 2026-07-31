import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import type {
  AudioEngine,
  SaveData,
} from '../../game/types';
import type {
  PlaytestCheckpointId,
  PlaytestChecklistId,
  PlaytestCounterKey,
  PlaytestErrorCategory,
  PlaytestContext,
  PlaytestTimelineEventKind,
} from '../../game/playtest/types';
import type { SaveUiActionResult } from '../save/SaveManagementPanel';

export type JourneySaveServices = Readonly<{
  persistenceEnabled: boolean;
  loadMessage: string;
  loadIssues: readonly string[];
  previousSaveAvailable: boolean;
  importJourneyJson: (text: string) => SaveUiActionResult;
  restorePreviousJourney: () => SaveUiActionResult;
}>;

export type JourneyAudioServices = Readonly<{
  engineRef: MutableRefObject<AudioEngine | null>;
  getEngine: () => AudioEngine;
}>;

export type JourneyPlaytestServices = Readonly<{
  enabled: boolean;
  recordEvent: (
    kind: PlaytestTimelineEventKind,
    label: string,
  ) => void;
  increment: (key: PlaytestCounterKey, amount?: number) => void;
  queueCheckpoint: (checkpointId: PlaytestCheckpointId) => void;
  markChecklist: (
    id: PlaytestChecklistId,
    complete: boolean,
  ) => void;
  recordError: (
    category: PlaytestErrorCategory,
    safeMessage: string,
  ) => void;
  setSafeForCheckpoint: (safe: boolean) => void;
  updateContext: (context: Partial<PlaytestContext>) => void;
}>;

export type JourneyGameProps = Readonly<{
  active: boolean;
  save: SaveData;
  initialMessage: string;
  onSaveChange: Dispatch<SetStateAction<SaveData>>;
  saveServices: JourneySaveServices;
  audioServices: JourneyAudioServices;
  playtestServices: JourneyPlaytestServices;
  onEditTrainer: () => void;
  onRestartJourney: () => void;
  onReturnToOpening: () => void;
}>;
