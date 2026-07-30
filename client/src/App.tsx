import { useEffect, useMemo, useRef, useState } from 'react';

import { createRetroAudioEngine } from './game/audio/retroAudioEngine';
import { GamePresentation } from './ui/game/GamePresentation';
import { AudioTestPanel } from './ui/debug/AudioTestPanel';
import {
  SaveManagementPanel,
  type SaveUiActionResult,
} from './ui/save/SaveManagementPanel';
import { WorkoutMiniGame } from './ui/workout/WorkoutMiniGame';
import {
  JourneyRestartDialog,
  TrainerCreationScreen,
} from './ui/trainer/TrainerCreationScreen';
import { PhysiqueReviewPanel } from './ui/trainer/PhysiqueReviewPanel';
import { BuddyIndex } from './ui/buddies/BuddyIndex';
import { BuddySprite as PixelCreature } from './ui/buddies/BuddySprite';
import { BuddyCustomizer } from './ui/buddies/BuddyCustomizer';
import type { BuddyBattlePose } from './game/assets/types';
import {
  BUDDY_STAT_LIMITS,
  FATIGUE_BALANCE,
  WORKOUT_BALANCE,
} from './game/content/balance';
import {
  CAPTURE_BATTLE_SPEEDS,
  CAPTURE_METER_MAX,
  CAPTURE_METER_MIN,
  WILD_CAPTURE_CONTROL_TARGET,
} from './game/content/captureBalance';
import {
  BUDDY_SPECIES as CREATURES,
  FANCY_NAMES,
} from './game/content/buddies';
import {
  BOSS_MAX_MS,
  BOSS_MIN_MS,
  getBossById,
  getBossesForGym,
} from './game/content/bosses';
import {
  bossBuddyCosmetics,
  getBossCharacterDesign,
} from './game/content/bossCharacters';
import { CAPTURE_MOVES as MOVES } from './game/content/captureMoves';
import {
  GYMS as AREAS,
  STARTING_ZONE_ID,
  WORLD_ZONE_POSITIONS,
  ZONE_NAMES as zoneNames,
  ZONE_VIBES,
  getDefaultGymMachine,
  getGymById,
} from './game/content/gyms';
import {
  getOverworldMap,
  locationIdForZone,
} from './game/content/maps/journeyMaps';
import {
  PRESENTATION_EFFECT_TIMING,
  getPresentationSequenceDuration,
  type BossEntranceCue,
  type DialoguePortrait,
  type PresentationEffectCue,
  type PresentationEffectKind,
  type PresentationEffectTone,
} from './game/phaser/presentationEffects';
import type { GamePresentationSnapshot } from './game/phaser/presentationConfig';
import { ALL_TRAINING_MACHINES as ALL_GYM_MACHINES } from './game/content/machines';
import {
  FALLBACK_UNLOCKED_ZONES,
  WORLD_DIRECTION_VECTORS,
  WORLD_GRID_HEIGHT,
  WORLD_GRID_PADDING,
  WORLD_GRID_WIDTH,
  WORLD_MOVE_COOLDOWN_MS,
  WORLD_PATH_LINKS,
  WORLD_ROUTE_ENCOUNTER_COOLDOWN_MS,
  WORLD_ROUTE_PATHS,
  WORLD_ROUTES,
  WORLD_TILE_PITCH,
  WORLD_TILE_PX,
} from './game/content/routes';
import { TEAM_SIZE } from './game/content/save';
import {
  inferVisitedZoneIds,
  JOURNEY_GYM_ZONE_IDS,
} from './game/content/worldGraph';
import {
  DEFAULT_TRAINER_BODY_PRESET_ID,
  getTrainerBodyPresetById,
} from './game/content/trainer';
import {
  getTrainerPhysiquePresetById,
} from './game/content/trainerAppearance';
import { TUTORIAL_STEPS } from './game/content/tutorial';
import { validateGameContentInDevelopment } from './game/content/validation';
import {
  inputActionToDirection,
  keyboardEventToAction,
  type InputAction,
} from './game/input/actionMap';
import {
  calculateBossCaptureTarget as bossCaptureTarget,
  calculateBossChallengePressure as bossChallengePressure,
  calculateBossChallengeStress,
  calculateBossChallengeSummary as bossChallengeSummary,
  calculateBossInterval,
  createBossEncounter,
  getBossChallengeMachine,
  getBossChallengeProfile as bossChallengeProfileForZone,
  getBossChallengeTier as bossChallengeTierFromEncounter,
} from './game/systems/bossChallenges';
import {
  advanceBossGameplayTime,
  claimBossSchedule,
  getBossAvailability,
  markBossCycleRewarded,
} from './game/systems/bossScheduling';
import {
  clampBuddyStat as clampBuddyStats,
  createCapturedBuddy,
  getBuddyStatBand as buddyStatBand,
} from './game/systems/buddyProgression';
import {
  calculateBuddyArenaPressure as buddyArenaPressure,
  calculateCaptureMovePrediction,
  calculateCaptureStartingStamina,
  calculateCaptureAttempt,
  calculateCaptureMove,
  calculateOpponentStartingStamina,
  calculateMatchReadinessModifier as matchReadinessModifier,
  calculateTrainerArenaPressure as trainerArenaPressure,
  selectCaptureOpponentIntent,
} from './game/systems/captureBattles';
import {
  planCapturePartyPlacement,
  replacePartyBuddy,
} from './game/systems/captureParty';
import {
  applyFatigueChange,
  applyPassiveRecovery,
  calculateRestRecovery,
  getFatigueRatio,
} from './game/systems/fatigueRecovery';
import { clamp, clamp01 } from './game/systems/math';
import {
  AUTOSAVE_MIN_INTERVAL_MS,
  getAutosaveDelayMs,
  hasOnlyAllowedTopLevelChanges,
} from './game/save/autosavePolicy';
import { createDefaultSaveData } from './game/save/saveDefaults';
import {
  getBrowserSaveStorage,
  hasPreviousSave,
  importSaveJson,
  loadGameSave,
  loadPreviousSave,
  writeGameSave,
  type SaveLoadResult,
} from './game/save/saveService';
import { recordMachineMastery } from './game/systems/progressionModel';
import {
  recordBodybuildingChallengeResult,
  resolveBodybuildingChallenge,
} from './game/systems/bodybuildingChallenges';
import {
  createOverworldState,
  findFacingInteractable,
  getOverworldDirectionAvailability,
  resolveOverworldAction,
} from './game/systems/overworldMovement';
import {
  createRandomState,
  createRuntimeSeed,
  type RandomState,
} from './game/systems/random';
import {
  applySteroidReward,
  getExperienceNeeded,
  resolveBossVictoryReward,
} from './game/systems/rewards';
import {
  calculateRouteEncounterBoost as routeEncounterBoost,
  calculateRouteEncounterChance,
  calculateRouteFatigueCost as routeFatigueCost,
  createWildEncounter,
  getRouteProfile as routeProfileFromZones,
  rollRouteEncounter,
} from './game/systems/routeEncounters';
import {
  applyTrainerBodyPreset,
  applyTrainerPhysiquePreset,
  createTrainerCreationDraft,
  replaceTrainerDraftAppearance,
  saveTrainerProfileToJourney,
  trainerProfileFromCreationDraft,
  updateTrainerDraftMuscle,
  validateTrainerCreationDraft,
} from './game/systems/trainerCreation';
import {
  applyDeepRecoveryToVisualProgression,
  applyWorkoutVisualProgression,
  calculatePhysiqueRatings,
  createDefaultVisualProgressionState,
  createPhysiqueSnapshot,
  deriveTrainerVisualPresentation,
  getCurrentPump,
} from './game/systems/visualProgression';
import {
  calculateTrainerPhysiqueLevel as trainerPhysiqueLevel,
} from './game/systems/trainerProgression';
import {
  normalizeUnlockedZones as normalizeUnlockedZoneIds,
  unlockAdjacentZones as unlockAdjacentZoneIds,
} from './game/systems/unlockProgression';
import {
  advanceWorkoutSession,
  calculateWorkoutPreview,
  calculateWorkoutReadiness,
  calculateWorkoutResolution,
  createWorkoutSession,
  getWorkoutMomentumLabel as workoutMomentumLabel,
  getWorkoutReadinessLabel as workoutReadinessLabel,
  getWorkoutSetStressLabel as workoutSetStressLabel,
  resolveWorkoutRep,
  resolveWorkoutSpot,
  shiftWorkoutSessionTiming,
} from './game/systems/workoutResolution';
import type {
  AudioEngine,
  AudioCueId,
  BossChallengeStress,
  BossChallengeTier,
  BossPresentationTier,
  BodybuildingChallengeId,
  BodybuildingChallengeResult,
  Buddy,
  BuddySpecies as Creature,
  CardinalDirection,
  CaptureMove as Move,
  CaptureBattleSpeed,
  Encounter,
  GymArea,
  GymZoneId,
  Match,
  MusicTrackId,
  OverworldState,
  SaveData,
  TrainerAppearance,
  TrainerAppearancePreset,
  TrainerCreationDraft,
  TrainerEmote,
  TrainerMuscleId,
  TrainerPose,
  TrainerStartMode,
  TrainerVisualProgressionPreferences,
  WorkoutLoadTier,
  WorkoutSession,
  WorldPosition,
  WorldRouteConnection,
  ZoneTransit,
} from './game/types';

validateGameContentInDevelopment();

const MAX_BUDDY_FORM = BUDDY_STAT_LIMITS.form;
const MAX_BUDDY_MOBILITY = BUDDY_STAT_LIMITS.mobility;
const MAX_BUDDY_VOLUME = BUDDY_STAT_LIMITS.volume;
const MAX_TRAINING_FATIGUE = FATIGUE_BALANCE.maximum;
const WORKOUT_DELOAD_MAX = WORKOUT_BALANCE.maximumDeloadTokens;
const WORKOUT_MOMENTUM_MAX = WORKOUT_BALANCE.maximumMomentum;

function bossChallengeThresholdText(tier: BossChallengeTier, zoneType: 'home' | 'starter' | 'higher') {
  if (tier === 'high' || zoneType === 'higher') return 'high';
  if (tier === 'normal') return 'medium';
  return 'low';
}

const WORLD_TILE_KEY = (pos: WorldPosition) => `${pos.x},${pos.y}`;

function addPathTile(setRef: Set<string>, from: WorldPosition, to: WorldPosition) {
  let x = from.x;
  let y = from.y;
  const deltaX = clamp(Math.sign(to.x - from.x), -1, 1);
  const deltaY = clamp(Math.sign(to.y - from.y), -1, 1);
  setRef.add(WORLD_TILE_KEY({ x, y }));
  while (x !== to.x || y !== to.y) {
    if (x !== to.x) {
      x += deltaX;
    } else if (y !== to.y) {
      y += deltaY;
    }
    setRef.add(WORLD_TILE_KEY({ x, y }));
  }
}

function buildWorldWalkableMap() {
  const walkable = new Set<string>();
  const zoneAt = new Map<string, string>();
  Object.entries(WORLD_ZONE_POSITIONS).forEach(([zoneId, position]) => {
    const key = WORLD_TILE_KEY(position);
    walkable.add(key);
    zoneAt.set(key, zoneId);
  });

  const seenEdges = new Set<string>();
  for (const [from, to] of WORLD_PATH_LINKS) {
    const edgeKey = [from, to].sort().join('::');
    if (seenEdges.has(edgeKey)) continue;
    seenEdges.add(edgeKey);
    const fromPos = WORLD_ZONE_POSITIONS[from];
    const toPos = WORLD_ZONE_POSITIONS[to];
    if (!fromPos || !toPos) continue;
    addPathTile(walkable, fromPos, toPos);
  }

  return {
    walkable,
    zoneAt,
  };
}

const WORLD_WALKABLE = buildWorldWalkableMap();
const WORLD_WALKABLE_TILES = WORLD_WALKABLE.walkable;
const WORLD_ZONE_BY_TILE = WORLD_WALKABLE.zoneAt;

function worldTileZoneId(pos: WorldPosition) {
  return WORLD_ZONE_BY_TILE.get(WORLD_TILE_KEY(pos)) ?? null;
}

function isWorldTileWalkable(pos: WorldPosition) {
  const key = WORLD_TILE_KEY(pos);
  return (
    Number.isInteger(pos.x) &&
    Number.isInteger(pos.y) &&
    pos.x >= 0 &&
    pos.y >= 0 &&
    pos.x < WORLD_GRID_WIDTH &&
    pos.y < WORLD_GRID_HEIGHT &&
    WORLD_WALKABLE_TILES.has(key)
  );
}

function worldTileToStyle(pos: WorldPosition) {
  return {
    left: WORLD_GRID_PADDING + pos.x * WORLD_TILE_PITCH,
    top: WORLD_GRID_PADDING + pos.y * WORLD_TILE_PITCH,
  };
}

function normalizeUnlockedZones(raw: string[] | undefined, fallback: string[] = FALLBACK_UNLOCKED_ZONES) {
  return normalizeUnlockedZoneIds({
    raw,
    fallback,
    validZoneIds: AREAS.map((zone) => zone.id),
    startingZoneId: STARTING_ZONE_ID,
  });
}

function normalizeVisitedZones(
  raw: readonly string[] | undefined,
  unlockedZoneIds: readonly string[],
  activeZoneId: string,
) {
  const valid = new Set<GymZoneId>(JOURNEY_GYM_ZONE_IDS);
  const inferred = inferVisitedZoneIds(unlockedZoneIds, activeZoneId);
  return [
    ...new Set([
      ...inferred,
      ...(raw ?? []).filter((zoneId): zoneId is GymZoneId =>
        valid.has(zoneId as GymZoneId),
      ),
    ]),
  ];
}

function unlockAdjacentZones(known: string[], zoneId: string) {
  return unlockAdjacentZoneIds({
    known,
    zoneId,
    routes: WORLD_ROUTES,
    fallback: FALLBACK_UNLOCKED_ZONES,
    validZoneIds: AREAS.map((zone) => zone.id),
    startingZoneId: STARTING_ZONE_ID,
  });
}

function formatRemainingTime(ms: number) {
  const left = Math.max(0, Math.ceil(ms / 1000));
  if (left <= 0) return 'ready';
  const minutes = Math.floor(left / 60);
  const seconds = left % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

let runtimeRandomState: RandomState = createRandomState(createRuntimeSeed());

function consumeRandomResult<T extends { randomState: RandomState }>(
  operation: (randomState: RandomState) => T,
) {
  const result = operation(runtimeRandomState);
  runtimeRandomState = result.randomState;
  return result;
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function nowMs() {
  return Date.now();
}

function bossInterval() {
  return consumeRandomResult((randomState) =>
    calculateBossInterval(randomState, BOSS_MIN_MS, BOSS_MAX_MS),
  ).intervalMs;
}

function createOpponent(zone: GymArea): Encounter {
  return consumeRandomResult((randomState) =>
    createWildEncounter({ gym: zone, species: CREATURES, randomState }),
  ).encounter;
}

function createBoss(zone: GymArea, scheduleCycle: number): Encounter {
  return consumeRandomResult((randomState) =>
    createBossEncounter({
      gym: zone,
      bosses: getBossesForGym(zone.id),
      species: CREATURES,
      scheduleCycle,
      randomState,
    }),
  ).encounter;
}

export default function App() {
  const saveStorageRef = useRef(getBrowserSaveStorage());
  const skipNextAutosaveRef = useRef(false);
  const initialSaveLoadRef = useRef<SaveLoadResult | null>(null);
  const [save, setSave] = useState<SaveData>(() => {
    const result = loadGameSave(saveStorageRef.current);
    initialSaveLoadRef.current = result;
    skipNextAutosaveRef.current = result.source === 'primary';
    return result.save;
  });
  const latestSaveRef = useRef(save);
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveDirtyRef = useRef(false);
  const lastAutosaveAtRef = useRef(0);
  const lastPersistedSaveRef = useRef(save);
  const [savePersistenceEnabled, setSavePersistenceEnabled] = useState(
    () => initialSaveLoadRef.current?.canAutosave ?? false,
  );
  const [saveLoadMessage, setSaveLoadMessage] = useState(
    () => initialSaveLoadRef.current?.message ?? 'Save service ready.',
  );
  const [saveLoadIssues, setSaveLoadIssues] = useState<string[]>(
    () => initialSaveLoadRef.current?.issues ?? [],
  );
  const [previousSaveAvailable, setPreviousSaveAvailable] = useState(
    () => hasPreviousSave(saveStorageRef.current),
  );
  const savePersistenceEnabledRef = useRef(savePersistenceEnabled);
  const persistLatestSaveRef = useRef<() => void>(() => undefined);
  latestSaveRef.current = save;
  savePersistenceEnabledRef.current = savePersistenceEnabled;
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [captureAnimation, setCaptureAnimation] = useState<{
    moveId: Move['id'];
    tone: 'counter' | 'advance' | 'resisted';
  } | null>(null);
  const captureAnimationTimerRef = useRef<number | null>(null);
  const presentationEffectSequenceRef = useRef(0);
  const presentationEffectTimerRef = useRef<number | null>(null);
  const [presentationEffect, setPresentationEffect] =
    useState<PresentationEffectCue | null>(null);
  const [bossEntrance, setBossEntrance] = useState<BossEntranceCue | null>(null);
  const bossEntranceTimerRef = useRef<number | null>(null);
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null);
  const [gameplayPaused, setGameplayPaused] = useState(false);
  const gameplayPausedRef = useRef(false);
  const gameplayPauseStartedAtRef = useRef<number | null>(null);
  const [selectedWorkoutLoad, setSelectedWorkoutLoad] =
    useState<WorkoutLoadTier>('steady');
  const [workoutFrame, setWorkoutFrame] = useState(nowMs);
  const [message, setMessage] = useState('Welcome to Gym Buddies. Start from Home Gym and build your team.');
  const [tick, setTick] = useState(nowMs);
  const [log, setLog] = useState<string[]>([
    'Home Gym open. Team and capture loop ready.',
    '6 Gym world loaded. Steroids work like level-up candies.',
  ]);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [zoneTransit, setZoneTransit] = useState<ZoneTransit | null>(null);
  const [trainerFacing, setTrainerFacing] = useState<CardinalDirection>('down');
  const [worldPlayerPos, setWorldPlayerPos] = useState<WorldPosition>(() => WORLD_ZONE_POSITIONS[save.activeZoneId] ?? WORLD_ZONE_POSITIONS.home);
  const [overworldState, setOverworldState] = useState<OverworldState>(() =>
    createOverworldState(locationIdForZone(save.activeZoneId) ?? 'home-gym'),
  );
  const [worldMoveLockUntil, setWorldMoveLockUntil] = useState(0);
  const [lastRouteEncounterMs, setLastRouteEncounterMs] = useState(0);
  const [previewZoneId, setPreviewZoneId] = useState<string | null>(null);
  const [trainerSetupMode, setTrainerSetupMode] = useState<'new' | 'edit'>('new');
  const [draftTrainer, setDraftTrainer] = useState<TrainerCreationDraft>(() =>
    applyTrainerBodyPreset(
      createTrainerCreationDraft(save.trainer),
      getTrainerBodyPresetById(DEFAULT_TRAINER_BODY_PRESET_ID),
    ),
  );
  const [trainerStartMode, setTrainerStartMode] =
    useState<TrainerStartMode>('guided');
  const [buddyCustomizationOpen, setBuddyCustomizationOpen] = useState(false);
  const [physiqueReviewOpen, setPhysiqueReviewOpen] = useState(false);
  const [bodybuildingChallengeResult, setBodybuildingChallengeResult] =
    useState<BodybuildingChallengeResult | null>(null);
  const [restartConfirmationOpen, setRestartConfirmationOpen] = useState(false);
  const [trainerEmote, setTrainerEmote] = useState<TrainerEmote>('neutral');
  const [trainerEmoteUntil, setTrainerEmoteUntil] = useState(0);
  const [nextRestAvailableMs, setNextRestAvailableMs] = useState(0);
  const [showStarterSetup, setShowStarterSetup] = useState(
    () => !save.hasStarterSet,
  );
  const audioRef = useRef<AudioEngine | null>(null);
  persistLatestSaveRef.current = () => {
    if (
      !savePersistenceEnabledRef.current ||
      !autosaveDirtyRef.current
    ) {
      return;
    }
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    const result = writeGameSave(
      saveStorageRef.current,
      latestSaveRef.current,
    );
    autosaveDirtyRef.current = false;
    lastAutosaveAtRef.current = nowMs();
    if (!result.ok) {
      setSavePersistenceEnabled(false);
      setSaveLoadMessage(
        `${result.message} Automatic saving is paused until a valid import or confirmed reset.`,
      );
      setSaveLoadIssues(result.issues);
      return;
    }
    lastPersistedSaveRef.current = latestSaveRef.current;
    if (result.backupCreated) setPreviousSaveAvailable(true);
  };

  function handleGameplayPauseChange(nextPaused: boolean) {
    if (gameplayPausedRef.current === nextPaused) return;
    if (nextPaused) {
      gameplayPauseStartedAtRef.current = nowMs();
    } else {
      const pauseStartedAt = gameplayPauseStartedAtRef.current;
      const pausedDuration =
        pauseStartedAt === null ? 0 : Math.max(0, nowMs() - pauseStartedAt);
      if (pausedDuration > 0) {
        setWorkoutSession((session) =>
          session
            ? shiftWorkoutSessionTiming(session, pausedDuration)
            : session,
        );
      }
      gameplayPauseStartedAtRef.current = null;
    }
    gameplayPausedRef.current = nextPaused;
    setGameplayPaused(nextPaused);
  }

  const activeZone = useMemo(
    () => AREAS.find((area) => area.id === save.activeZoneId) ?? getGymById(STARTING_ZONE_ID),
    [save.activeZoneId],
  );

  const activeBuddy = save.team[save.activeIndex] ?? null;
  const activeMachine = useMemo(() => {
    const id = save.selectedMachineByZone[activeZone.id];
    return activeZone.machines.find((machine) => machine.id === id) ?? getDefaultGymMachine(activeZone);
  }, [activeZone, save.selectedMachineByZone]);
  const bossSchedule = save.bossSchedules[activeZone.id];
  const activeGymBosses = getBossesForGym(activeZone.id);
  const activeBossAvailability = getBossAvailability(
    bossSchedule,
    save.bossGameplayTimeMs,
  );
  const bossTicker =
    activeBossAvailability.status === 'ready'
      ? 'READY'
      : formatRemainingTime(activeBossAvailability.remainingMs);
  const trainer = save.trainer;
  const trainerVisualPresentation = useMemo(
    () =>
      deriveTrainerVisualPresentation({
        baseAppearance: trainer.appearance,
        state: save.visualProgression,
        gameplayTimeMs: save.bossGameplayTimeMs,
        fatigue: save.trainingFatigue,
      }),
    [
      save.bossGameplayTimeMs,
      save.trainingFatigue,
      save.visualProgression,
      trainer.appearance,
    ],
  );
  const physiqueRatings = useMemo(
    () =>
      calculatePhysiqueRatings({
        trainer,
        development: save.visualProgression.development,
        pump: getCurrentPump(
          save.visualProgression,
          save.bossGameplayTimeMs,
        ),
        fatigue: save.trainingFatigue,
        recentTrainingCount: save.visualProgression.recentTraining.length,
      }),
    [
      save.bossGameplayTimeMs,
      save.trainingFatigue,
      save.visualProgression,
      trainer,
    ],
  );
  const workoutPreview = useMemo(
    () =>
      activeBuddy && activeMachine
        ? calculateWorkoutPreview({
            buddy: activeBuddy,
            machine: activeMachine,
            trainer,
            gymKind: activeZone.type,
            selectedLoad: selectedWorkoutLoad,
            trainingFatigue: save.trainingFatigue,
            workoutMomentum: save.workoutMomentum,
            deloadTokens: save.deloadTokens,
            consecutiveMachineUses:
              save.machineTrainingHistory.lastMachineId === activeMachine.id
                ? save.machineTrainingHistory.repeatedUses
                : 0,
            machineMasteryXp:
              save.machineTrainingHistory.masteryByMachineId[activeMachine.id]
                ?.xp ?? 0,
          })
        : null,
    [
      activeBuddy,
      activeMachine,
      activeZone.type,
      save.deloadTokens,
      save.machineTrainingHistory,
      save.trainingFatigue,
      save.workoutMomentum,
      selectedWorkoutLoad,
      trainer,
    ],
  );
  const unlockedZoneSet = useMemo(() => new Set(save.unlockedZoneIds), [save.unlockedZoneIds]);
  const overworldProgression = useMemo(
    () => ({
      visitedZoneIds: normalizeVisitedZones(
        save.visitedZoneIds,
        save.unlockedZoneIds,
        save.activeZoneId,
      ),
      defeatedGymIds: JOURNEY_GYM_ZONE_IDS.filter(
        (zoneId) => (save.bossSchedules[zoneId]?.defeated ?? 0) > 0,
      ),
    }),
    [
      save.activeZoneId,
      save.bossSchedules,
      save.unlockedZoneIds,
      save.visitedZoneIds,
    ],
  );
  const encounterZone = encounter ? AREAS.find((area) => area.id === encounter.zoneId) ?? activeZone : activeZone;
  const encounterBoss = getBossById(encounter?.bossId);
  const encounterBossCharacterDesign = getBossCharacterDesign(
    encounter?.bossId,
  );
  const encounterBossPresentationTier: BossPresentationTier =
    match?.status === 'captured' || match?.status === 'full-party'
      ? 'defeated'
      : match?.isBossChallengeActive && match.bossChallengeMisses >= 3
        ? 'overload'
        : match && match.round >= Math.max(2, match.maxRounds - 1)
          ? 'final-round'
          : match && match.round > 1
            ? 'pumped'
            : 'normal';
  const encounterBossPresentation = encounterBossCharacterDesign
    ?.presentationTiers.find(
      (entry) => entry.tier === encounterBossPresentationTier,
    );
  const encounterBossCosmetics = encounterBossCharacterDesign
    ? bossBuddyCosmetics(
        encounterBossCharacterDesign,
        encounterBossPresentationTier,
      )
    : null;
  const dialoguePortrait: DialoguePortrait = encounter?.creature
    ? {
        accent: encounter.creature.palette.accent,
        base: encounter.creature.palette.core,
        initial: (encounterBoss?.name ?? encounter.creature.name).slice(0, 1).toUpperCase(),
        kind: encounterBoss ? 'boss' : 'buddy',
        name: encounterBoss?.name ?? encounter.creature.name,
      }
    : workoutSession && activeBuddy
      ? {
          accent: activeBuddy.creature.palette.accent,
          base: activeBuddy.creature.palette.core,
          initial: activeBuddy.nickname.slice(0, 1).toUpperCase(),
          kind: 'buddy',
          name: activeBuddy.nickname,
        }
      : {
          accent: trainer.top,
          base: trainer.skin,
          initial: trainer.name?.slice(0, 1).toUpperCase() || 'T',
          kind: 'trainer',
          name: trainer.name || 'Trainer',
        };
  const captureSpeed =
    CAPTURE_BATTLE_SPEEDS.find(
      (speed) => speed.id === save.captureBattleSpeed,
    ) ?? CAPTURE_BATTLE_SPEEDS[1]!;
  const bossEntranceDuration = getPresentationSequenceDuration(
    PRESENTATION_EFFECT_TIMING.bossEntranceMs,
    save.captureBattleSpeed,
    save.accessibility.reducedMotion,
  );
  const capturePlayerReactionClass = captureAnimation
    ? captureAnimation.tone === 'resisted'
      ? 'buddy-reaction-brace'
      : 'buddy-reaction-drive'
    : match?.status === 'captured'
      ? 'buddy-reaction-victory'
      : match?.status === 'escape' || match?.status === 'failed-pin'
        ? 'buddy-reaction-stagger'
        : '';
  const captureOpponentReactionClass = captureAnimation
    ? captureAnimation.tone === 'resisted'
      ? 'buddy-reaction-drive'
      : 'buddy-reaction-brace'
    : match?.status === 'captured' || match?.status === 'full-party'
      ? 'buddy-reaction-bond'
      : match?.status === 'escape'
        ? 'buddy-reaction-escape'
        : '';
  const selectedMoveBattlePose: BuddyBattlePose =
    captureAnimation?.tone === 'counter'
      ? 'counter'
      : captureAnimation?.moveId === 'burst'
        ? 'shoulder-burst'
        : captureAnimation?.moveId === 'grind'
          ? 'iron-grind'
          : captureAnimation?.moveId === 'snap'
            ? 'snapping-hook'
            : 'neutral-battle';
  const capturePlayerBattlePose: BuddyBattlePose = captureAnimation
    ? selectedMoveBattlePose
    : match?.status === 'captured' ||
        match?.status === 'full-party'
      ? 'capture-success'
      : match?.status === 'failed-pin'
        ? 'near-pin'
        : match?.status === 'escape'
          ? 'defeat'
          : 'neutral-battle';
  const captureOpponentBattlePose: BuddyBattlePose = captureAnimation
    ? captureAnimation.tone === 'resisted'
      ? 'counter'
      : 'near-pin'
    : match?.status === 'captured' ||
        match?.status === 'full-party'
      ? 'defeat'
      : match?.status === 'near-capture'
        ? 'near-pin'
        : match?.status === 'escape'
          ? 'escape'
          : match?.status === 'failed-pin'
            ? 'victory'
            : 'neutral-battle';
  const encounterChallengeMachine = encounter?.isBoss ? getBossChallengeMachine(encounter, encounterZone) : null;
  const encounterTrainerPressure = encounter ? trainerArenaPressure(trainer, activeMachine, encounterZone) : 0;
  const encounterBuddyPressure = encounter && activeBuddy ? buddyArenaPressure(activeBuddy) : 0;
  const encounterMachineBonus =
    encounter && encounter.isBoss && activeMachine ? bossChallengePressure(encounter, encounterZone, activeMachine) : 0;
  const isMatchChallengeAligned = match?.isBossChallengeActive && match.bossChallengeMachineId && activeMachine
    ? activeMachine.id === match.bossChallengeMachineId
    : null;
  const activeMatchChallengeSummary = match ? bossChallengeSummary(match.encounter, encounterZone, activeMachine ?? null) : null;
  const activeMatchChallengeProfile = match
    ? bossChallengeProfileForZone(encounterZone.type, match.encounter)
    : bossChallengeProfileForZone(encounterZone.type);
  const matchChallengeMissCount = match?.bossChallengeMisses ?? 0;
  const matchChallengeNearMissCount = match?.bossChallengeNearMisses ?? 0;
  const activeMatchCaptureTarget = match?.encounter?.isBoss
    ? bossCaptureTarget({
        gym: encounterZone,
        encounter: match.encounter,
        isChallengeAligned: isMatchChallengeAligned,
        missCount: match.bossChallengeMisses,
        nearMissCount: match.bossChallengeNearMisses,
        matchStreak: match.bossChallengeMatchStreak,
        buddy: activeBuddy ?? undefined,
      })
    : WILD_CAPTURE_CONTROL_TARGET;
  const captureMovePredictions = useMemo(
    () =>
      match?.status === 'playing' && activeBuddy
        ? new Map(
            MOVES.map((move) => [
              move.id,
              calculateCaptureMovePrediction({
                match,
                gym: encounterZone,
                trainer,
                buddy: activeBuddy,
                trainingFatigue: save.trainingFatigue,
                move,
                selectedMachine: activeMachine,
              }),
            ]),
          )
        : new Map(),
    [
      activeBuddy,
      encounterZone,
      match,
      activeMachine,
      save.trainingFatigue,
      trainer,
    ],
  );
  const isMatchChallengeStreakReady =
    match?.isBossChallengeActive &&
    isMatchChallengeAligned === true &&
    (match?.bossChallengeMatchStreak ?? 0) >= activeMatchChallengeProfile.streakLimit;
  const isMatchChallengeInDanger =
    match?.isBossChallengeActive &&
    !isMatchChallengeAligned &&
    matchChallengeMissCount >= Math.max(1, Math.ceil(activeMatchChallengeProfile.streakLimit / 1.6));
  const isMatchChallengeOverload = match?.isBossChallengeActive
    ? match.bossChallengeMisses >= activeMatchChallengeProfile.overloadMissLimit
    : false;
  const isMatchChallengeForcedRecovery =
    isMatchChallengeOverload && match?.encounter?.isBoss && isMatchChallengeAligned === false;
  const activeMatchChallengeStressMath = calculateBossChallengeStress(
    match,
    activeMachine,
    encounterZone.type,
  );
  const activeMatchChallengeStress: BossChallengeStress = match?.encounter?.isBoss && match.isBossChallengeActive
    ? {
        ...activeMatchChallengeStressMath,
        label:
          activeMatchChallengeStressMath.percent > 84
            ? 'Overload'
            : activeMatchChallengeStressMath.percent > 70
              ? 'Danger'
              : activeMatchChallengeStressMath.percent > 35
                ? 'Caution'
                : 'Stable',
        detail:
          match.bossChallengeMisses + matchChallengeNearMissCount > 0
            ? `${matchChallengeMissCount} misses · ${matchChallengeNearMissCount} near misses`
            : 'No pressure events yet',
      }
    : {
        ...activeMatchChallengeStressMath,
        label: 'No stress',
        detail: 'No active boss challenge pressure',
      };
  const challengeAlignmentText =
    match?.isBossChallengeActive && match.bossChallengeMachineId && isMatchChallengeAligned !== null
      ? isMatchChallengeAligned
        ? `Holding challenge machine: ${match.bossChallengeMachineName ?? 'required machine'}`
        : `Not on required machine: ${match.bossChallengeMachineName ?? 'required machine'}`
      : null;
  const tutorialActive = save.tutorialStep < TUTORIAL_STEPS.length;
  const currentTutorialText =
    TUTORIAL_STEPS[Math.min(save.tutorialStep, TUTORIAL_STEPS.length - 1)]?.text ?? '';
  const zoneVibe = ZONE_VIBES[activeZone.id] ?? { icon: '🗺', mood: 'Unknown', theme: 'open gym', accent: 'Unknown' };
  const activeEmote: TrainerEmote = trainerEmoteUntil > tick ? trainerEmote : 'neutral';
  const trainerPhysique = trainerPhysiqueLevel(trainer.muscles);
  const draftTrainerPhysique = trainerPhysiqueLevel(draftTrainer.muscles);
  const fatigueRatio = getFatigueRatio(save.trainingFatigue);
  const canRest = activeBuddy && !workoutSession && !encounter && !match && nowMs() >= nextRestAvailableMs;
  const restCooldownSeconds = Math.max(0, Math.ceil((nextRestAvailableMs - tick) / 1000));
  const connectedZones = WORLD_ROUTES[save.activeZoneId] ?? [];
  const worldPlayerPixelPos = worldTileToStyle(worldPlayerPos);
  const isTraveling = Boolean(zoneTransit);
  const trainingFatigueLevel = workoutReadinessLabel(clamp(1 - save.trainingFatigue / MAX_TRAINING_FATIGUE, 0, 1));
  const connectedWalks = (Object.entries(WORLD_DIRECTION_VECTORS) as Array<[CardinalDirection, WorldPosition]>)
    .map(([direction, delta]) => {
      const next: WorldPosition = {
        x: worldPlayerPos.x + delta.x,
        y: worldPlayerPos.y + delta.y,
      };
      const blocked = !isWorldTileWalkable(next);
      const destinationZone = worldTileZoneId(next);
      if (blocked) return null;
      if (destinationZone && !isZoneUnlocked(destinationZone)) return null;
      const fromZone = worldTileZoneId(worldPlayerPos);
      const routeFatigue = routeFatigueCost(fromZone, destinationZone, activeZone.type);
      const routeInfo = routeProfileFromZones(fromZone, destinationZone);
      return {
        direction,
        next,
        destinationZone,
        routeName: routeInfo?.routeName ?? 'Route tile',
        routeFatigue,
        encounterBoost: routeEncounterBoost(fromZone, destinationZone),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  const movementHint = connectedWalks.length
    ? connectedWalks
        .map(
          ({ direction, destinationZone, routeName, routeFatigue, encounterBoost }) =>
            `${direction.toUpperCase()}: ${routeName} → ${destinationZone ? zoneNames[destinationZone] ?? destinationZone : 'Path'} (+${routeFatigue} fatigue${
              encounterBoost ? `, +${Math.round(encounterBoost * 100)}% encounter` : ''
            })`,
        )
        .join(' · ')
    : 'No exits available';
  const worldMoveCooldownRemaining = Math.max(0, worldMoveLockUntil - tick);
  const worldMovePercent = clamp01(1 - worldMoveCooldownRemaining / WORLD_MOVE_COOLDOWN_MS);
  const worldMoveBlocked = nowMs() < worldMoveLockUntil;
  const canMoveInWorld = !isTraveling && !worldMoveBlocked;
  const activeOverworldMap = getOverworldMap(overworldState.locationId);
  const overworldDirectionAvailability = useMemo(
    () => getOverworldDirectionAvailability(overworldState),
    [overworldState],
  );
  const facingOverworldInteractable = useMemo(
    () => findFacingInteractable(activeOverworldMap, overworldState),
    [activeOverworldMap, overworldState],
  );
  const connectedWalkByDirection = Object.fromEntries(connectedWalks.map((entry) => [entry.direction, entry])) as Record<
    CardinalDirection,
    {
      direction: CardinalDirection;
      next: WorldPosition;
      destinationZone: string | null;
      routeName: string;
      routeFatigue: number;
      encounterBoost: number;
    }
  >;
  const routeScoutCooldownRemaining = Math.max(0, WORLD_ROUTE_ENCOUNTER_COOLDOWN_MS - (tick - lastRouteEncounterMs));
  const isZoneUnlocked = (zoneId: string) => unlockedZoneSet.has(zoneId);

  function getAudioEngine() {
    if (audioRef.current) {
      return audioRef.current;
    }
    const engine = createRetroAudioEngine();
    if (typeof document !== 'undefined') {
      engine.setPageHidden(document.visibilityState !== 'visible');
    }
    audioRef.current = engine;
    return engine;
  }

  function syncAudioEngineSettings(engine: AudioEngine) {
    engine.setEnabled(save.audio.enabled);
    engine.setVolumes(
      save.audio.musicVolume,
      save.audio.sfxVolume,
    );
  }

  function desiredMusicTrack(): MusicTrackId {
    if (workoutSession && !workoutSession.resolved) return 'training';
    if (
      encounter?.isBoss ||
      (match?.status === 'playing' && match.encounter?.isBoss)
    ) {
      return 'boss-challenge';
    }
    if (encounter || match?.status === 'playing') {
      return 'wild-encounter';
    }
    if (
      activeZone.type === 'home' &&
      activeOverworldMap.kind !== 'route'
    ) {
      return 'home-gym';
    }
    return 'route-exploration';
  }

  function updateMusic(engine = getAudioEngine()) {
    syncAudioEngineSettings(engine);
    engine.setMusic(desiredMusicTrack());
  }

  function activateAudioEngine() {
    const engine = getAudioEngine();
    updateMusic(engine);
    return engine.unlock();
  }

  function playAudioCue(cueId: AudioCueId, intensity = 1) {
    const engine = getAudioEngine();
    updateMusic(engine);
    void engine.unlock().then((ready) => {
      if (ready) engine.emitSfx(cueId, intensity);
    });
  }

  function auditionAudioTrack(trackId: MusicTrackId) {
    const engine = getAudioEngine();
    syncAudioEngineSettings(engine);
    engine.setMusic(trackId);
    void engine.unlock();
  }

  function setAudioEnabled(enabled: boolean) {
    setSave((state) => ({
      ...state,
      audio: {
        ...state.audio,
        enabled,
      },
    }));
    const engine = getAudioEngine();
    engine.setEnabled(enabled);
    engine.setVolumes(save.audio.musicVolume, save.audio.sfxVolume);
    if (enabled) {
      engine.setMusic(desiredMusicTrack());
      void engine.unlock();
    }
  }

  function setMusicVolume(value: number) {
    const volume = clamp01(value);
    setSave((state) => ({
      ...state,
      audio: {
        ...state.audio,
        musicVolume: volume,
      },
    }));
    if (!audioRef.current) return;
    audioRef.current.setVolumes(volume, save.audio.sfxVolume);
  }

  function setSfxVolume(value: number) {
    const volume = clamp01(value);
    setSave((state) => ({
      ...state,
      audio: {
        ...state.audio,
        sfxVolume: volume,
      },
    }));
    if (!audioRef.current) return;
    audioRef.current.setVolumes(save.audio.musicVolume, volume);
  }

  function setCaptureBattleSpeed(value: CaptureBattleSpeed) {
    if (!CAPTURE_BATTLE_SPEEDS.some((speed) => speed.id === value)) return;
    setSave((state) => ({
      ...state,
      captureBattleSpeed: value,
    }));
  }

  function setAccessibilitySettings(
    accessibility: SaveData['accessibility'],
  ) {
    setSave((state) => ({
      ...state,
      accessibility: { ...accessibility },
    }));
  }

  function setKeyboardBindings(
    keyboardBindings: SaveData['input']['keyboardBindings'],
  ) {
    setSave((state) => ({
      ...state,
      input: {
        ...state.input,
        keyboardBindings,
      },
    }));
  }

  function getGymBossTicker(zone: GymArea) {
    const availability = getBossAvailability(
      save.bossSchedules[zone.id],
      save.bossGameplayTimeMs,
    );
    return availability.status === 'ready'
      ? 'READY'
      : formatRemainingTime(availability.remainingMs);
  }

  function trySpawnRouteEncounter(zone: GymArea, encounterBoost = 0, routeName = 'Route') {
    const now = nowMs();
    if (zone.type === 'home') return;
    if (now - lastRouteEncounterMs < WORLD_ROUTE_ENCOUNTER_COOLDOWN_MS) {
      return;
    }
    const encounterChance = calculateRouteEncounterChance({
      gymKind: zone.type,
      encounterBoost,
      trainingFatigue: save.trainingFatigue,
    });
    if (encounter || match || workoutSession) {
      return;
    }
    const spawnRoll = consumeRandomResult((randomState) =>
      rollRouteEncounter(randomState, encounterChance),
    );
    if (spawnRoll.shouldSpawn) {
      const next = createOpponent(zone);
      setEncounter(next);
      setMatch(null);
      setSave((state) => ({
        ...state,
        seenDex: state.seenDex.includes(next.creature.dex) ? state.seenDex : [...state.seenDex, next.creature.dex],
      }));
      setMessage(`A wild ${next.creature.name} stepped out via ${routeName} near ${zone.name}.`);
      pushLog(`Scouted ${next.creature.name} Lv.${next.level} via ${routeName} at ${zone.name}.`);
      playAudioCue(
        next.creature.isExotic ? 'rare-encounter' : 'wild-alert',
        next.creature.isExotic ? 1.1 : 0.8,
      );
      setLastRouteEncounterMs(now);
    }
  }

  function startBossChallenge(gym: GymArea) {
    if (encounter || match || workoutSession) {
      setMessage('Finish the current activity before answering a boss challenge.');
      return;
    }
    const schedule = save.bossSchedules[gym.id];
    if (!schedule) {
      setMessage('This gym is still preparing its boss challenge.');
      return;
    }
    const availability = getBossAvailability(
      schedule,
      save.bossGameplayTimeMs,
    );
    if (availability.status !== 'ready') {
      setMessage(
        `Boss challenge available after ${formatRemainingTime(availability.remainingMs)} of active play.`,
      );
      return;
    }
    const scheduleCycle = schedule.cycle + 1;
    const boss = createBoss(gym, scheduleCycle);
    if (!boss.bossId) return;
    const claimed = claimBossSchedule({
      schedule,
      gameplayTimeMs: save.bossGameplayTimeMs,
      nextIntervalMs: bossInterval(),
      bossId: boss.bossId,
    });
    if (!claimed.claimed) return;
    setEncounter(boss);
    setMatch(null);
    const entranceSequence = presentationEffectSequenceRef.current + 1;
    presentationEffectSequenceRef.current = entranceSequence;
    setBossEntrance({
      bossName: boss.bossName ?? 'Gym challenger',
      gymName: gym.name,
      sequence: entranceSequence,
      signature: boss.bossRequiredMoveName ?? 'adaptive pressure',
    });
    cuePresentationEffect(
      'boss-entrance',
      'neutral',
      boss.bossName ?? 'Boss challenge',
    );
    playAudioCue('boss-alert', 1.2);
    setSave((state) => ({
      ...state,
      bossSchedules: {
        ...state.bossSchedules,
        [gym.id]: claimed.schedule,
      },
    }));
    const challenge = boss.bossChallengeMachineName ?? 'the announced machine';
    const requiredMove = boss.bossRequiredMoveName ?? 'the announced move';
    setMessage(
      `${boss.bossName} answered at ${gym.name}. Link ${challenge} with ${requiredMove}.`,
    );
    pushLog(
      `Boss challenge in ${gym.name}: ${boss.bossName} Lv.${boss.level} · ${challenge} + ${requiredMove}.`,
    );
  }

  useEffect(() => {
    if (!zoneTransit) return;
    const duration = getPresentationSequenceDuration(
      PRESENTATION_EFFECT_TIMING.routeTransitionMs,
      save.captureBattleSpeed,
      save.accessibility.reducedMotion,
    );
    const id = window.setTimeout(() => setZoneTransit(null), duration);
    return () => clearTimeout(id);
  }, [
    save.accessibility.reducedMotion,
    save.captureBattleSpeed,
    zoneTransit,
  ]);

  useEffect(() => {
    if (!bossEntrance) return;
    if (bossEntranceTimerRef.current) {
      clearTimeout(bossEntranceTimerRef.current);
    }
    const duration = getPresentationSequenceDuration(
      PRESENTATION_EFFECT_TIMING.bossEntranceMs,
      save.captureBattleSpeed,
      save.accessibility.reducedMotion,
    );
    bossEntranceTimerRef.current = window.setTimeout(() => {
      setBossEntrance(null);
      bossEntranceTimerRef.current = null;
    }, duration);
    return () => {
      if (bossEntranceTimerRef.current) {
        clearTimeout(bossEntranceTimerRef.current);
        bossEntranceTimerRef.current = null;
      }
    };
  }, [
    bossEntrance,
    save.accessibility.reducedMotion,
    save.captureBattleSpeed,
  ]);

  useEffect(
    () => () => {
      if (captureAnimationTimerRef.current) {
        clearTimeout(captureAnimationTimerRef.current);
      }
      if (bossEntranceTimerRef.current) {
        clearTimeout(bossEntranceTimerRef.current);
      }
      if (presentationEffectTimerRef.current) {
        clearTimeout(presentationEffectTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const activeTile = WORLD_ZONE_POSITIONS[save.activeZoneId];
    if (!activeTile) return;
    const playerZoneAtPos = worldTileZoneId(worldPlayerPos);
    if (!isTraveling && playerZoneAtPos && playerZoneAtPos !== save.activeZoneId) {
      setWorldPlayerPos((state) => {
        if (worldTileZoneId(state) === save.activeZoneId) return state;
        return activeTile;
      });
    }
  }, [save.activeZoneId, isTraveling, worldPlayerPos.x, worldPlayerPos.y]);

  useEffect(() => {
    const locationId = locationIdForZone(save.activeZoneId);
    if (!locationId) return;
    setOverworldState((current) => {
      const currentMap = getOverworldMap(current.locationId);
      if (currentMap.zoneId === save.activeZoneId || current.locationId === locationId) {
        return current;
      }
      return createOverworldState(locationId);
    });
  }, [save.activeZoneId]);

  useEffect(() => {
    if (gameplayPaused || !workoutSession || workoutSession.resolved) return;
    setWorkoutFrame(nowMs());
    const timer = window.setInterval(() => {
      setWorkoutFrame(nowMs());
    }, 90);
    return () => clearInterval(timer);
  }, [gameplayPaused, workoutSession?.id, workoutSession?.resolved]);

  useEffect(() => {
    if (gameplayPaused || !workoutSession || workoutSession.resolved) return;
    const timer = window.setInterval(() => {
      setWorkoutSession((current) => {
        if (!current || current.resolved) return current;
        const now = nowMs();
        const next = advanceWorkoutSession(current, now);
        if (next.resolved && !current.resolved) {
          queueMicrotask(() => resolveWorkoutSession(next));
        }
        return next;
      });
    }, 90);
    return () => clearInterval(timer);
  }, [gameplayPaused, workoutSession?.id, workoutSession?.resolved]);

  useEffect(() => {
    if (gameplayPaused || !workoutSession || !workoutSession.resolved) return;
    const timeout = window.setTimeout(
      () => setWorkoutSession((current) => (current?.resolved ? null : current)),
      WORKOUT_BALANCE.resolvedDisplayMs,
    );
    return () => clearTimeout(timeout);
  }, [gameplayPaused, workoutSession?.id, workoutSession?.resolved]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        gameplayPausedRef.current ||
        document.visibilityState !== 'visible' ||
        !save.hasStarterSet
      ) {
        return;
      }
      setTick(nowMs());
      setSave((state) => ({
        ...state,
        bossGameplayTimeMs: advanceBossGameplayTime(
          state.bossGameplayTimeMs,
          1_000,
          true,
        ),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [save.hasStarterSet]);

  useEffect(() => {
    if (
      gameplayPaused ||
      save.trainingFatigue <= 0 ||
      encounter ||
      match ||
      workoutSession
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setSave((state) => {
        const recovery = applyPassiveRecovery(
          {
            trainingFatigue: state.trainingFatigue,
            workoutMomentum: state.workoutMomentum,
          },
          activeZone.id === 'home',
        );
        return { ...state, ...recovery };
      });
    }, FATIGUE_BALANCE.passiveRecoveryTickMs);
    return () => clearInterval(timer);
  }, [
    activeZone.id,
    encounter,
    gameplayPaused,
    match,
    workoutSession,
    save.trainingFatigue,
  ]);

  useEffect(() => {
    const engine = getAudioEngine();
    updateMusic(engine);
  }, [
    activeZone.id,
    activeZone.type,
    activeOverworldMap.kind,
    save.audio.enabled,
    save.audio.musicVolume,
    save.audio.sfxVolume,
    Boolean(encounter),
    encounter?.isBoss,
    match?.status,
    match?.encounter?.isBoss,
    Boolean(workoutSession && !workoutSession.resolved),
  ]);

  useEffect(() => {
    if (!save.hasStarterSet || showStarterSetup) return;
    function onKeyDown(event: KeyboardEvent) {
      if (gameplayPausedRef.current) return;
      if (restartConfirmationOpen) {
        if (event.key === 'Escape') setRestartConfirmationOpen(false);
        return;
      }
      if (showRoadmap) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'button' ||
        tag === 'select' ||
        target?.isContentEditable
      ) {
        return;
      }
      if (target?.closest('[data-game-presentation="true"]')) return;

      const action = keyboardEventToAction(
        event,
        save.input.keyboardBindings,
      );
      if (!action || action === 'menu' || action === 'debug-toggle') return;

      event.preventDefault();
      handlePresentationAction(action);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    save.hasStarterSet,
    showStarterSetup,
    restartConfirmationOpen,
    showRoadmap,
    overworldState,
    encounter,
    match,
    workoutSession,
    isTraveling,
    lastRouteEncounterMs,
    save.activeZoneId,
    save.input.keyboardBindings,
    save.trainingFatigue,
  ]);

  useEffect(() => {
    const onVisibilityChange = () => {
      audioRef.current?.setPageHidden(
        gameplayPausedRef.current ||
          document.visibilityState !== 'visible',
      );
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    onVisibilityChange();
    return () =>
      document.removeEventListener(
        'visibilitychange',
        onVisibilityChange,
      );
  }, []);

  useEffect(() => {
    audioRef.current?.setPageHidden(
      gameplayPaused || document.visibilityState !== 'visible',
    );
  }, [gameplayPaused]);

  useEffect(() => {
    document.documentElement.dataset.gbHighContrast =
      save.accessibility.highContrast ? 'true' : 'false';
    document.documentElement.dataset.gbReducedMotion =
      save.accessibility.reducedMotion ? 'true' : 'false';
    return () => {
      delete document.documentElement.dataset.gbHighContrast;
      delete document.documentElement.dataset.gbReducedMotion;
    };
  }, [
    save.accessibility.highContrast,
    save.accessibility.reducedMotion,
  ]);

  useEffect(() => {
    return () => {
      if (!audioRef.current) return;
      audioRef.current.dispose();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const openSetup = new URLSearchParams(window.location.search).get('setup') === '1';
    if (openSetup) {
      setTrainerSetupMode(save.hasStarterSet ? 'edit' : 'new');
      setDraftTrainer(createTrainerCreationDraft(save.trainer));
      setShowStarterSetup(true);
      return;
    }
    const storage = saveStorageRef.current;
    if (!storage) return;
    try {
      const forceSetup = storage.getItem('gymbuddies-force-setup');
      if (forceSetup === '1') {
        setTrainerSetupMode('new');
        setShowStarterSetup(true);
        storage.removeItem('gymbuddies-force-setup');
      }
    } catch {
      // The save service has already selected its in-memory fallback.
    }
  }, []);

  useEffect(() => {
    if (!savePersistenceEnabled) {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      autosaveDirtyRef.current = false;
      return;
    }
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      autosaveDirtyRef.current = false;
      lastPersistedSaveRef.current = save;
      return;
    }

    autosaveDirtyRef.current = true;
    const clockOnlyChange = hasOnlyAllowedTopLevelChanges(
      lastPersistedSaveRef.current,
      save,
      ['bossGameplayTimeMs'],
    );
    const delay = clockOnlyChange
      ? getAutosaveDelayMs(
          lastAutosaveAtRef.current,
          nowMs(),
          AUTOSAVE_MIN_INTERVAL_MS,
        )
      : 0;
    if (delay === 0) {
      persistLatestSaveRef.current();
      return;
    }
    if (autosaveTimerRef.current !== null) return;
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      persistLatestSaveRef.current();
    }, delay);
  }, [save, savePersistenceEnabled]);

  useEffect(() => {
    const flushPendingSave = () => persistLatestSaveRef.current();
    const flushWhenHidden = () => {
      if (document.visibilityState !== 'visible') flushPendingSave();
    };
    window.addEventListener('pagehide', flushPendingSave);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('pagehide', flushPendingSave);
      document.removeEventListener('visibilitychange', flushWhenHidden);
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, []);

  function resetTutorial() {
    setSave((state) => ({ ...state, tutorialStep: 0 }));
  }

  function nextTutorialStep() {
    setSave((state) => {
      const next = Math.min(state.tutorialStep + 1, TUTORIAL_STEPS.length);
      if (next >= TUTORIAL_STEPS.length) {
        setMessage('Tutorial complete. Start training and scouting for buddies.');
      }
      return {
        ...state,
        tutorialStep: next,
      };
    });
  }

  function finishTutorialNow() {
    setSave((state) => ({ ...state, tutorialStep: TUTORIAL_STEPS.length }));
    setMessage('Tutorial skipped. Good luck, trainer.');
  }

  function setDraftTrainerName(value: string) {
    setDraftTrainer((state) => ({
      ...state,
      name: value.slice(0, 14),
    }));
  }

  function setDraftTrainerAppearance(appearance: TrainerAppearance) {
    setDraftTrainer((state) =>
      replaceTrainerDraftAppearance(state, appearance),
    );
  }

  function setDraftTrainerMuscle(
    group: TrainerMuscleId,
    value: number,
  ) {
    setDraftTrainer((state) => updateTrainerDraftMuscle(state, group, value));
  }

  function setDraftTrainerPreset(presetId: string) {
    setDraftTrainer((state) =>
      applyTrainerBodyPreset(state, getTrainerBodyPresetById(presetId)),
    );
  }

  function launchTrainer() {
    const trainerProfile = trainerProfileFromCreationDraft(draftTrainer);
    if (trainerSetupMode === 'edit') {
      setSave((state) => saveTrainerProfileToJourney(state, draftTrainer));
      setDraftTrainer(createTrainerCreationDraft(trainerProfile));
      setShowStarterSetup(false);
      setMessage(
        `Trainer profile saved for ${trainerProfile.name}. Journey progress was preserved.`,
      );
      return;
    }

    const startWithTutorial = trainerStartMode === 'guided';
    setShowStarterSetup(false);
    setSave((state) => ({
      ...state,
      hasStarterSet: true,
      activeZoneId: STARTING_ZONE_ID,
      unlockedZoneIds: normalizeUnlockedZones(FALLBACK_UNLOCKED_ZONES),
      visitedZoneIds: ['home'],
      tutorialStep: startWithTutorial ? 0 : TUTORIAL_STEPS.length,
      trainer: trainerProfile,
      visualProgression: createDefaultVisualProgressionState(
        trainerProfile.appearance,
      ),
    }));
    setOverworldState(createOverworldState('home-gym'));
    setWorldPlayerPos(WORLD_ZONE_POSITIONS[STARTING_ZONE_ID] ?? WORLD_ZONE_POSITIONS.home);
    setWorldMoveLockUntil(0);
    setTrainerFacing('down');
    setMessage(
      startWithTutorial
        ? `Welcome, ${trainerProfile.name}. Your guided journey begins at Home Gym.`
        : `Welcome, ${trainerProfile.name}. Your normal journey begins at Home Gym.`,
    );
    playAudioCue('menu-navigate', 0.9);
    window.requestAnimationFrame(() => {
      document.getElementById('root')?.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }

  function setDraftTrainerPhysiquePreset(presetId: string) {
    setDraftTrainer((state) =>
      applyTrainerPhysiquePreset(
        state,
        getTrainerPhysiquePresetById(presetId),
      ),
    );
  }

  function setDraftTrainerAppearancePresets(
    presets: readonly TrainerAppearancePreset[],
  ) {
    setDraftTrainer((state) => ({
      ...state,
      appearancePresets: presets.map((preset) => ({
        ...preset,
        appearance: {
          ...preset.appearance,
          build: { ...preset.appearance.build },
          face: { ...preset.appearance.face },
          hair: { ...preset.appearance.hair },
          outfit: { ...preset.appearance.outfit },
          colors: { ...preset.appearance.colors },
          accessories: { ...preset.appearance.accessories },
        },
      })),
    }));
  }

  function setVisualProgressionPreferences(
    preferences: TrainerVisualProgressionPreferences,
  ) {
    setSave((state) => ({
      ...state,
      visualProgression: {
        ...state.visualProgression,
        preferences: { ...preferences },
      },
    }));
  }

  function openPhysiqueReview() {
    if (activeZone.id !== 'home') {
      setMessage('The Physique Review studio is available inside Home Gym.');
      return;
    }
    setBodybuildingChallengeResult(null);
    setPhysiqueReviewOpen(true);
    handleGameplayPauseChange(true);
  }

  function closePhysiqueReview() {
    setPhysiqueReviewOpen(false);
    handleGameplayPauseChange(false);
  }

  function savePhysiqueSnapshot(label?: string) {
    setSave((state) => ({
      ...state,
      visualProgression: createPhysiqueSnapshot({
        state: state.visualProgression,
        appearance: state.trainer.appearance,
        gameplayTimeMs: state.bossGameplayTimeMs,
        fatigue: state.trainingFatigue,
        label,
      }),
    }));
    setMessage(
      label === 'Pixel portrait'
        ? 'Pixel portrait saved inside Physique Review.'
        : 'Physique progress snapshot saved.',
    );
  }

  function runBodybuildingChallenge(input: {
    challengeId: BodybuildingChallengeId;
    selectedPose: TrainerPose;
    timingPrecision: number;
    preparation: number;
    outfitAlignment: number;
  }) {
    const result = consumeRandomResult((randomState) =>
      resolveBodybuildingChallenge(
        {
          ...input,
          fatigue: save.trainingFatigue,
          development: save.visualProgression.development,
          pump: getCurrentPump(
            save.visualProgression,
            save.bossGameplayTimeMs,
          ),
          trainingHistory: save.visualProgression.recentTraining,
          trainerMuscles: save.trainer.muscles,
        },
        randomState,
      ),
    );
    setBodybuildingChallengeResult(result);
    setSave((state) => ({
      ...state,
      visualProgression: recordBodybuildingChallengeResult(
        state.visualProgression,
        result,
      ),
    }));
    setMessage(
      result.completed
        ? `Stage challenge cleared at ${result.score}/100. A new presentation reward was unlocked.`
        : `Stage challenge scored ${result.score}/100. Recovery, timing, pose, outfit, and training history all contribute.`,
    );
    playAudioCue(result.completed ? 'level-up' : 'menu-navigate', 0.74);
  }

  function adjustVisualProgressionDebug(
    group: keyof SaveData['visualProgression']['development'],
    target: 'development' | 'pump',
    delta: number,
  ) {
    if (!import.meta.env.DEV) return;
    setSave((state) => {
      const visualProgression = state.visualProgression;
      if (target === 'development') {
        return {
          ...state,
          visualProgression: {
            ...visualProgression,
            development: {
              ...visualProgression.development,
              [group]: clamp(
                visualProgression.development[group] + delta,
                0,
                100,
              ),
            },
          },
        };
      }
      const currentPump = getCurrentPump(
        visualProgression,
        state.bossGameplayTimeMs,
      );
      return {
        ...state,
        visualProgression: {
          ...visualProgression,
          pump: {
            levels: {
              ...currentPump,
              [group]: clamp(currentPump[group] + delta, 0, 100),
            },
            updatedAtGameplayMs: state.bossGameplayTimeMs,
          },
        },
      };
    });
  }

  function reopenTrainerSetup() {
    setTrainerSetupMode('edit');
    setDraftTrainer(createTrainerCreationDraft(save.trainer));
    setShowStarterSetup(true);
    setMessage('Trainer studio opened. Saving changes will preserve journey progress.');
  }

  function cancelTrainerEdit() {
    setDraftTrainer(createTrainerCreationDraft(save.trainer));
    setShowStarterSetup(false);
    setRestartConfirmationOpen(false);
    setMessage('Trainer changes canceled. Journey progress is unchanged.');
  }

  function requestJourneyRestart() {
    setRestartConfirmationOpen(true);
  }

  function applyLoadedSave(
    next: SaveData,
    statusMessage: string,
    issues: readonly string[] = [],
  ) {
    const locationId =
      locationIdForZone(next.activeZoneId) ?? 'home-gym';
    skipNextAutosaveRef.current = true;
    setSave(next);
    setSavePersistenceEnabled(true);
    setSaveLoadMessage(statusMessage);
    setSaveLoadIssues([...issues]);
    setEncounter(null);
    setMatch(null);
    setWorkoutSession(null);
    setCaptureAnimation(null);
    setZoneTransit(null);
    setOverworldState(createOverworldState(locationId));
    setWorldPlayerPos(
      WORLD_ZONE_POSITIONS[next.activeZoneId] ??
        WORLD_ZONE_POSITIONS.home,
    );
    setWorldMoveLockUntil(0);
    setTrainerFacing('down');
    setDraftTrainer(createTrainerCreationDraft(next.trainer));
    setTrainerSetupMode('new');
    setShowStarterSetup(!next.hasStarterSet);
    setMessage(statusMessage);
  }

  function importJourneyJson(text: string): SaveUiActionResult {
    const fallback = createDefaultSaveData({
      accessibility: save.accessibility,
    });
    const imported = importSaveJson(text, {
      fallback,
      accessibility: save.accessibility,
    });
    if (!imported.ok) {
      setSaveLoadIssues(imported.issues);
      return {
        ok: false,
        message: `${imported.message} The current journey was not changed.`,
      };
    }
    const written = writeGameSave(
      saveStorageRef.current,
      imported.save,
      { allowOverwriteUnsupported: true },
    );
    if (!written.ok) {
      setSaveLoadIssues(written.issues);
      return {
        ok: false,
        message: `${written.message} The current journey was not changed.`,
      };
    }
    setPreviousSaveAvailable(
      written.backupCreated ||
        hasPreviousSave(saveStorageRef.current),
    );
    const migrationText = imported.appliedMigrations.length
      ? ` Migrated with ${imported.appliedMigrations.join(', ')}.`
      : '';
    const statusMessage = `Imported a validated schema-14 Gym Buddies save.${migrationText}`;
    applyLoadedSave(imported.save, statusMessage, imported.issues);
    return { ok: true, message: statusMessage };
  }

  function restorePreviousJourney(): SaveUiActionResult {
    const previous = loadPreviousSave(
      saveStorageRef.current,
      createDefaultSaveData({
        accessibility: save.accessibility,
      }),
    );
    if (!previous.ok) {
      setSaveLoadIssues(previous.issues);
      return {
        ok: false,
        message: `${previous.message} The current journey was not changed.`,
      };
    }
    const written = writeGameSave(
      saveStorageRef.current,
      previous.save,
      { allowOverwriteUnsupported: true },
    );
    if (!written.ok) {
      setSaveLoadIssues(written.issues);
      return {
        ok: false,
        message: `${written.message} The current journey was not changed.`,
      };
    }
    setPreviousSaveAvailable(true);
    const statusMessage =
      'Restored the previous validated save. The replaced journey is now the previous-save backup.';
    applyLoadedSave(previous.save, statusMessage, previous.issues);
    return { ok: true, message: statusMessage };
  }

  function restartOpeningProcess() {
    const fresh = createDefaultSaveData({
      accessibility: save.accessibility,
      audio: save.audio,
    });
    const written = writeGameSave(saveStorageRef.current, fresh, {
      allowOverwriteUnsupported: true,
    });
    if (!written.ok) {
      setRestartConfirmationOpen(false);
      setSaveLoadMessage(
        `${written.message} The current journey was not reset.`,
      );
      setSaveLoadIssues(written.issues);
      setMessage('Reset canceled because the new save could not be stored safely.');
      return;
    }
    setPreviousSaveAvailable(
      written.backupCreated ||
        hasPreviousSave(saveStorageRef.current),
    );
    setSavePersistenceEnabled(true);
    setSaveLoadMessage(
      'Journey reset completed. The prior valid journey is available under Restore Previous.',
    );
    setSaveLoadIssues([]);
    skipNextAutosaveRef.current = true;
    setSave(fresh);
    setTrainerSetupMode('new');
    setDraftTrainer(
      applyTrainerBodyPreset(
        createTrainerCreationDraft(fresh.trainer),
        getTrainerBodyPresetById(DEFAULT_TRAINER_BODY_PRESET_ID),
      ),
    );
    setTrainerStartMode('guided');
    setRestartConfirmationOpen(false);
    setOverworldState(createOverworldState('home-gym'));
    setWorldPlayerPos(WORLD_ZONE_POSITIONS.home);
    setWorldMoveLockUntil(0);
    setTrainerFacing('down');
    setShowStarterSetup(true);
    setMessage('Journey restarted. Create a trainer to begin again from Home Gym.');
  }

  function moveTrainerByDirection(direction: CardinalDirection) {
    if (isTraveling) {
      setMessage('Wait for the zone transition to settle.');
      return;
    }

    const now = nowMs();
    if (now < worldMoveLockUntil) {
      setMessage('Stride lock active. Try again after a brief pause.');
      return;
    }

    const next = {
      x: worldPlayerPos.x + WORLD_DIRECTION_VECTORS[direction].x,
      y: worldPlayerPos.y + WORLD_DIRECTION_VECTORS[direction].y,
    };
    const nextZoneId = worldTileZoneId(next);
    const fromZoneId = worldTileZoneId(worldPlayerPos) ?? save.activeZoneId;
    const routeProfile = routeProfileFromZones(fromZoneId, nextZoneId);
    const fatigueGain = routeFatigueCost(fromZoneId, nextZoneId, activeZone.type);
    const routeName = routeProfile?.routeName ?? 'Route tile';

    if (!isWorldTileWalkable(next)) {
      setMessage(`No clear path for ${direction.toUpperCase()}.`);
      return;
    }

    if (nextZoneId && !isZoneUnlocked(nextZoneId)) {
      setMessage(`This route to ${zoneNames[nextZoneId] ?? nextZoneId} is not unlocked yet.`);
      return;
    }

    const routeBoost = routeProfile?.encounterBoost ?? 0;

    setSave((state) => ({
      ...state,
      trainingFatigue: applyFatigueChange(state.trainingFatigue, fatigueGain),
    }));
    setTrainerFacing(direction);
    setWorldPlayerPos(next);
    setWorldMoveLockUntil(now + WORLD_MOVE_COOLDOWN_MS);
    setMessage(
      `Moved ${direction.toUpperCase()} via ${routeName}. Fatigue +${Math.round(fatigueGain * 10) / 10}.`,
    );
    if (nextZoneId && nextZoneId !== save.activeZoneId) {
      travelToZone(nextZoneId);
    } else {
      trySpawnRouteEncounter(activeZone, routeBoost, routeName);
    }
  }

  function mapPointForZone(zoneId: string) {
    const point = WORLD_ZONE_POSITIONS[zoneId];
    if (!point) return null;
    return worldTileToStyle(point);
  }

  function routeSignPosition(route: WorldRouteConnection) {
    const fromPos = WORLD_ZONE_POSITIONS[route.from];
    const toPos = WORLD_ZONE_POSITIONS[route.to];
    if (!fromPos || !toPos) return null;
    const fromStyle = worldTileToStyle(fromPos);
    const toStyle = worldTileToStyle(toPos);
    return {
      left: fromStyle.left + (toStyle.left - fromStyle.left) / 2,
      top: fromStyle.top + (toStyle.top - fromStyle.top) / 2,
    };
  }

  function getRouteTransitionPreview(zoneId: string) {
    const zone = AREAS.find((entry) => entry.id === zoneId);
    if (!zone) return null;

    const routePath = (() => {
      if (zoneId === save.activeZoneId) return [save.activeZoneId];
      const queue: string[] = [save.activeZoneId];
      const previous = new Map<string, string | null>([[save.activeZoneId, null]]);
      const visited = new Set<string>([save.activeZoneId]);
      let pointer = 0;
      let targetReached = false;

      while (pointer < queue.length && !targetReached) {
        const current = queue[pointer++];
        const neighbors = WORLD_ROUTES[current] ?? [];

        for (const next of neighbors) {
          if (visited.has(next)) continue;
          if (!isZoneUnlocked(next) && next !== zoneId) continue;

          visited.add(next);
          previous.set(next, current);
          queue.push(next);

          if (next === zoneId) {
            targetReached = true;
            break;
          }
        }
      }

      if (!targetReached) return null;

      const path: string[] = [];
      let cursor: string | null = zoneId;
      while (cursor) {
        path.unshift(cursor);
        cursor = previous.get(cursor) ?? null;
      }
      return path;
    })();

    const routeProfile = routeProfileFromZones(save.activeZoneId, zoneId);
    const isDirect = WORLD_ROUTES[save.activeZoneId]?.includes(zoneId);
    const isUnlocked = isZoneUnlocked(zoneId);
    const routePathLength = routePath?.length ?? 0;
    const routeDistance = Math.max(0, routePathLength - 1);
    const routePathName =
      routePathLength > 1 ? routePath!.map((entry) => zoneNames[entry] ?? entry).join(' → ') : zoneNames[zoneId] ?? zoneId;
    let pathFatigueCost = 0;
    let pathEncounterBoost = 0;

    if (routePath && routePathLength > 1) {
      for (let index = 0; index < routePathLength - 1; index += 1) {
        const from = routePath[index];
        const to = routePath[index + 1];
        pathFatigueCost += routeFatigueCost(from, to, activeZone.type);
        pathEncounterBoost += routeProfileFromZones(from, to)?.encounterBoost ?? 0;
      }
    }

    const normalizedEncounterChance = routeDistance
      ? calculateRouteEncounterChance({
          gymKind: zone.type,
          encounterBoost: pathEncounterBoost / Math.max(1, routeDistance),
          trainingFatigue: save.trainingFatigue,
        })
      : 0;
    const fatigueCost = routeDistance > 0 ? pathFatigueCost / routeDistance : pathFatigueCost;
    return {
      zone,
      isDirect,
      isUnlocked,
      routePath: routePath ?? null,
      routeDistance,
      routePathName,
      routeName: routeDistance > 1 ? `${routeDistance}-hop route` : routeProfile?.routeName ?? 'Route',
      fatigueCost,
      encounterBoost: routeProfile?.encounterBoost ?? 0,
      encounterChance: normalizedEncounterChance,
      canTravelNow: isUnlocked && routePathLength > 0,
      bossTicker: getGymBossTicker(zone),
    };
  }

  function travelToZone(zoneId: string) {
    if (isTraveling || !canMoveInWorld) {
      setMessage('Keep moving with a steady stride before changing lanes again.');
      return;
    }
    const zone = AREAS.find((entry) => entry.id === zoneId);
    if (!zone) return;
    if (zoneId !== save.activeZoneId && !WORLD_ROUTES[save.activeZoneId]?.includes(zoneId)) {
      setMessage('No direct open-world path to that gym yet. Travel through connected routes.');
      return;
    }
    if (!isZoneUnlocked(zoneId)) {
      setMessage(`${zone.name} has not been unlocked yet. Visit nearby routes first.`);
      return;
    }

    const zonePos = WORLD_ZONE_POSITIONS[zoneId];
    if (!zonePos) {
      setMessage('That destination is not mapped yet.');
      return;
    }
    const currentPos = WORLD_ZONE_POSITIONS[save.activeZoneId];
    if (currentPos) {
      const directionX = Math.sign(zonePos.x - currentPos.x);
      const directionY = Math.sign(zonePos.y - currentPos.y);
      if (directionX > 0) setTrainerFacing('right');
      else if (directionX < 0) setTrainerFacing('left');
      else if (directionY > 0) setTrainerFacing('down');
      else if (directionY < 0) setTrainerFacing('up');
    }

    if (zonePos) {
      setWorldPlayerPos(zonePos);
    }
    window.setTimeout(() => {
      switchArea(zoneId);
    }, 220);
  }

  function pulseTrainerEmote(state: TrainerEmote, ttl = 1800) {
    setTrainerEmote(state);
    setTrainerEmoteUntil(nowMs() + ttl);
  }

  function cuePresentationEffect(
    kind: PresentationEffectKind,
    tone: PresentationEffectTone,
    label: string,
  ) {
    const sequence = presentationEffectSequenceRef.current + 1;
    presentationEffectSequenceRef.current = sequence;
    setPresentationEffect({ kind, label, sequence, tone });
    if (presentationEffectTimerRef.current) {
      clearTimeout(presentationEffectTimerRef.current);
    }
    const visibleMs = save.accessibility.reducedMotion
      ? PRESENTATION_EFFECT_TIMING.reducedMotionSequenceMs
      : kind === 'boss-entrance' || kind === 'level-up'
        ? 700
        : 520;
    presentationEffectTimerRef.current = window.setTimeout(() => {
      setPresentationEffect((current) =>
        current?.sequence === sequence ? null : current,
      );
      presentationEffectTimerRef.current = null;
    }, visibleMs);
  }

  function skipPresentationSequence() {
    if (captureAnimationTimerRef.current) {
      clearTimeout(captureAnimationTimerRef.current);
      captureAnimationTimerRef.current = null;
    }
    if (bossEntranceTimerRef.current) {
      clearTimeout(bossEntranceTimerRef.current);
      bossEntranceTimerRef.current = null;
    }
    if (presentationEffectTimerRef.current) {
      clearTimeout(presentationEffectTimerRef.current);
      presentationEffectTimerRef.current = null;
    }
    setCaptureAnimation(null);
    setBossEntrance(null);
    setPresentationEffect(null);
    setZoneTransit(null);
  }

  function skipZoneTransit() {
    setZoneTransit(null);
  }

  function pushLog(entry: string) {
    setLog((prev) => [entry, ...prev].slice(0, 12));
  }

  function switchArea(id: string) {
    if (id === save.activeZoneId) return;
    const allowed = WORLD_ROUTES[save.activeZoneId]?.includes(id) || id === save.activeZoneId;
    if (!isZoneUnlocked(id)) {
      setMessage(`${zoneNames[id] ?? id} has not unlocked yet.`);
      return;
    }
    if (!allowed) {
      setMessage('No direct open-world path to that gym yet. Travel through connected routes.');
      return;
    }

    const zone = AREAS.find((area) => area.id === id);
    if (!zone) return;
    if (workoutSession && !workoutSession.resolved) {
      setWorkoutSession(null);
      setMessage('You left while your Buddy was in training. The set ends.');
    }

    const zoneTile = WORLD_ZONE_POSITIONS[id];
    if (zoneTile) {
      setWorldPlayerPos(zoneTile);
    }

    setSave((state) => ({
      ...state,
      activeZoneId: id,
      unlockedZoneIds: unlockAdjacentZones(state.unlockedZoneIds, id),
      visitedZoneIds: [...new Set([...state.visitedZoneIds, id])],
    }));
    const routeProfile = routeProfileFromZones(save.activeZoneId, id);
    const routeEncounterBonus = routeProfile?.encounterBoost ?? 0;
    const routeFatigue = routeFatigueCost(activeZone.id, id, activeZone.type);
    const encounterChance = calculateRouteEncounterChance({
      gymKind: zone.type,
      encounterBoost: routeEncounterBonus,
      trainingFatigue: save.trainingFatigue,
    });
    setZoneTransit({
      from: activeZone.name,
      to: zone.name,
      icon: ZONE_VIBES[id]?.icon ?? '🗺',
      routeName: routeProfile?.routeName,
      routeFatigue,
      routeEncounterBoost: routeEncounterBonus,
      routeScoutChance: routeEncounterBonus > 0 || encounterChance ? encounterChance : undefined,
    });
    setEncounter(null);
    setMatch(null);
    playAudioCue('route-transition', 0.6);
    const machineName = getDefaultGymMachine(zone).name;
    setMessage(`Moved to ${zone.name}. Current machine: ${machineName}.`);
    pulseTrainerEmote('focus', 1600);
    const routeBoost = routeEncounterBoost(save.activeZoneId, id);
    trySpawnRouteEncounter(zone, routeBoost, routeProfile?.routeName ?? 'Route');
  }

  function selectBuddy(index: number) {
    if (!save.team[index]) return;
    if (workoutSession && !workoutSession.resolved) {
      setMessage('Finish the active training set before swapping Buddy slots.');
      return;
    }
    setSave((state) => ({ ...state, activeIndex: index }));
    setBuddyCustomizationOpen(false);
    setMessage(`Selected ${save.team[index].nickname}.`);
    playAudioCue('menu-navigate', 0.55);
  }
  function selectMachine(id: string) {
    setSave((state) => ({
      ...state,
      selectedMachineByZone: {
        ...state.selectedMachineByZone,
        [activeZone.id]: id,
      },
    }));
    const machine = activeZone.machines.find((entry) => entry.id === id);
    if (machine) {
      setMessage(`Selected ${machine.name} in ${activeZone.name}.`);
      playAudioCue('menu-navigate', 0.55);
    }
  }

  function renderStarterSetup() {
    return (
      <TrainerCreationScreen
        draft={draftTrainer}
        keyboardBindings={save.input.keyboardBindings}
        mode={trainerSetupMode}
        physiqueLevel={draftTrainerPhysique}
        reducedMotion={save.accessibility.reducedMotion}
        restartConfirmationOpen={restartConfirmationOpen}
        startMode={trainerStartMode}
        validationIssues={validateTrainerCreationDraft(draftTrainer)}
        onAppearanceChange={setDraftTrainerAppearance}
        onAppearancePresetsChange={setDraftTrainerAppearancePresets}
        onCancelEdit={cancelTrainerEdit}
        onCancelRestart={() => setRestartConfirmationOpen(false)}
        onConfirm={launchTrainer}
        onConfirmRestart={restartOpeningProcess}
        onMuscleChange={setDraftTrainerMuscle}
        onNameChange={setDraftTrainerName}
        onPhysiquePresetSelect={setDraftTrainerPhysiquePreset}
        onPresetSelect={setDraftTrainerPreset}
        onRequestRestart={requestJourneyRestart}
        onStartModeChange={setTrainerStartMode}
      />
    );
  }
  function resolveWorkoutSession(session: WorkoutSession) {
    const machine = ALL_GYM_MACHINES.find((entry) => entry.id === session.machineId);
    if (!machine) {
      setWorkoutSession(null);
      return;
    }

    if (!session.resolved) return;
    const outcome = session.outcome ?? 'failure';
    const target = save.team.find((entry) => entry.id === session.buddyId);
    if (!target) {
      setWorkoutSession(null);
      return;
    }
    const resolution = calculateWorkoutResolution({
      session,
      outcome,
      buddy: target,
      machine,
      trainer: save.trainer,
      steroids: save.steroids,
      workoutMomentum: save.workoutMomentum,
      trainingFatigue: save.trainingFatigue,
    });
    setSave((state) => ({
      ...state,
      trainer: resolution.trainer,
      steroids: state.steroids + resolution.steroidsAwarded,
      deloadTokens: clamp(
        state.deloadTokens + resolution.deloadTokensAwarded,
        0,
        WORKOUT_DELOAD_MAX,
      ),
      workoutMomentum: resolution.workoutMomentum,
      trainingFatigue: resolution.trainingFatigue,
      visualProgression: applyWorkoutVisualProgression({
        state: state.visualProgression,
        machineId: machine.id,
        gameplayTimeMs: state.bossGameplayTimeMs,
        loadTier: session.loadTier,
        outcome,
        quality: session.sessionQuality,
        volume: Math.max(session.repResults.length, session.repCount),
      }),
      machineTrainingHistory: {
        lastMachineId: machine.id,
        repeatedUses:
          state.machineTrainingHistory.lastMachineId === machine.id
            ? state.machineTrainingHistory.repeatedUses + 1
            : 1,
        masteryByMachineId: {
          ...state.machineTrainingHistory.masteryByMachineId,
          [machine.id]: recordMachineMastery({
            current:
              state.machineTrainingHistory.masteryByMachineId[machine.id],
            outcome,
            quality: session.sessionQuality,
          }),
        },
      },
      team: state.team.map((buddy) =>
        buddy.id === session.buddyId
          ? { ...buddy, ...resolution.buddy }
          : buddy,
      ),
    }));

    const qualityLabel =
      session.sessionQuality >= 0.82
        ? 'Excellent technique'
        : session.sessionQuality >= 0.64
          ? 'Solid technique'
          : session.sessionQuality >= 0.45
            ? 'Recoverable technique'
            : 'Inconsistent technique';
    if (outcome === 'success') {
      const resultBuddy = resolution.buddy;
      setMessage(
        `${resultBuddy.nickname} completed ${session.loadTier.toUpperCase()} on ${machine.name}: +${resolution.xpAwarded}XP${resolution.leveled ? ' and leveled up.' : ''} · ${machine.focus} · `
          + `${qualityLabel} ${percent(session.sessionQuality)} · HP ${resolution.hpChange >= 0 ? '+' : ''}${resolution.hpChange}`
          + ` · Fatigue ${resolution.fatigueDelta >= 0 ? '+' : ''}${resolution.fatigueDelta}`
          + ` · Momentum ${resolution.momentumDelta >= 0 ? '+' : ''}${resolution.momentumDelta}`
          + ` · Form ${resultBuddy.form} (${buddyStatBand(resultBuddy.form, MAX_BUDDY_FORM)})`
          + ` · Mobility ${resultBuddy.mobility} (${buddyStatBand(resultBuddy.mobility, MAX_BUDDY_MOBILITY)})`
          + ` · Volume ${resultBuddy.volume} (${buddyStatBand(resultBuddy.volume, MAX_BUDDY_VOLUME)})`
          + `${resolution.steroidsAwarded ? ' · Boost Token dropped.' : ''}`
          + `${resolution.deloadTokensAwarded ? ' · Deload Token dropped.' : ''}`
          + `${session.rewardEfficiency < 1 ? ` · Repeat yield ${percent(session.rewardEfficiency)}.` : ''}`,
      );
      pushLog(`${resultBuddy.nickname} completed a technique set on ${machine.name} at ${activeZone.name}.`);
      playAudioCue(
        resolution.leveled ? 'level-up' : 'rep-success',
        Math.min(
          1.6,
          resolution.xpAwarded / machine.rewardTable.buddyXp.max,
        ),
      );
      cuePresentationEffect(
        resolution.leveled ? 'level-up' : 'rep-success',
        'success',
        resolution.leveled ? `LEVEL ${resultBuddy.level}` : 'SET CLEAR',
      );
      pulseTrainerEmote('level', resolution.leveled ? 1200 : 900);
      return;
    }

    if (outcome === 'rescued') {
      setMessage(
        `Spot saved part of ${target.nickname}'s ${session.loadTier.toUpperCase()} set: +${resolution.xpAwarded}XP`
          + ` · HP ${resolution.hpChange} · Fatigue +${resolution.fatigueDelta}`
          + ` · Form ${resolution.growth.form >= 0 ? '+' : ''}${resolution.growth.form}`
          + ` · ${qualityLabel} ${percent(session.sessionQuality)}.`
          + ' The rescue limited the consequences, but a clean set earns more.',
      );
      pushLog(`${target.nickname}'s set on ${machine.name} was partially saved by a spot.`);
      cuePresentationEffect('rep-success', 'neutral', 'SPOT SAVE');
      pulseTrainerEmote('focus', 900);
      playAudioCue('rep-success', 0.75);
      return;
    }

    setMessage(
      `${target.nickname}'s ${session.loadTier.toUpperCase()} set ended after the rescue window.`
        + ` HP ${resolution.hpChange} · Fatigue +${resolution.fatigueDelta}`
        + ` · ${resolution.growth.form < 0 ? `Form -${Math.abs(resolution.growth.form)}` : `Form +${resolution.growth.form}`}`
        + `, Mobility ${resolution.growth.mobility < 0 ? `-${Math.abs(resolution.growth.mobility)}` : `+${resolution.growth.mobility}`}`
        + `, Volume ${resolution.growth.volume < 0 ? `-${Math.abs(resolution.growth.volume)}` : `+${resolution.growth.volume}`}`
        + ` · ${qualityLabel} ${percent(session.sessionQuality)}`
        + `. ${workoutSetStressLabel(session.setStress)} stress and missed timing caused the outcome.`,
    );
    pushLog(`${target.nickname}'s set on ${machine.name} ended after a missed spot.`);
    cuePresentationEffect('rep-failure', 'failure', 'SET ENDED');
    pulseTrainerEmote('drained', 900);
    playAudioCue('rep-failure', 1);
    setTrainerEmote('drained');
    setTrainerEmoteUntil(nowMs() + 900);
  }

  function sendToWorkout() {
    if (workoutSession && !workoutSession.resolved) {
      setMessage('A training set is already running.');
      return;
    }
    if (!activeBuddy) return;
    if (!activeMachine) {
      setMessage('No machine selected in this gym.');
      return;
    }
    if (!workoutPreview) return;
    if (activeBuddy.hp <= Math.max(1, -workoutPreview.expectedHpChange)) {
      setMessage(
        `${activeBuddy.nickname} is too worn down to push ${activeMachine.name} right now. Rest or pick a low-fatigue machine.`,
      );
      return;
    }
    if (encounter) {
      setMessage('Finish the active encounter before training.');
      return;
    }

    const now = nowMs();
    const workout = consumeRandomResult((randomState) =>
      createWorkoutSession({
        buddy: activeBuddy,
        machine: activeMachine,
        trainer,
        gymKind: activeZone.type,
        trainingFatigue: save.trainingFatigue,
        workoutMomentum: save.workoutMomentum,
        deloadTokens: save.deloadTokens,
        consecutiveMachineUses:
          save.machineTrainingHistory.lastMachineId === activeMachine.id
            ? save.machineTrainingHistory.repeatedUses
            : 0,
        machineMasteryXp:
          save.machineTrainingHistory.masteryByMachineId[activeMachine.id]
            ?.xp ?? 0,
        selectedLoad: selectedWorkoutLoad,
        startedAt: now,
        randomState,
      }),
    );
    const { deloadUsed, session } = workout;

    if (deloadUsed > 0) {
      setSave((state) => ({
        ...state,
        deloadTokens: clamp(state.deloadTokens - deloadUsed, 0, WORKOUT_DELOAD_MAX),
      }));
    }

    setWorkoutSession(session);
    const deloadLabel = deloadUsed > 0 ? `Deload used: ${deloadUsed} · ` : '';

    setMessage(
      `${activeBuddy.nickname} starts a skill set on ${activeMachine.name}: ${session.loadTier.toUpperCase()} load (${percent(
        session.loadPressure,
      )}). ${deloadLabel}Readiness ${session.readinessLabel} ${percent(session.readiness)} · ${workoutSetStressLabel(session.setStress)} strain (${percent(
        session.setStress,
      )}). Press Lock Rep inside the timing zone.`,
    );
    pulseTrainerEmote('focus', 900);
    playAudioCue(activeMachine.soundCueId, 0.6);
    pushLog(`${activeBuddy.nickname} began training on ${activeMachine.name} with ${percent(session.failChance)} fail chance.`);
  }

  function performWorkoutAction() {
    if (!workoutSession || workoutSession.resolved) return;
    const at = nowMs();
    const next =
      workoutSession.phase === 'rep'
        ? resolveWorkoutRep(workoutSession, at)
        : resolveWorkoutSpot({
            session: workoutSession,
            inputAt: at,
          }).session;
    setWorkoutSession(next);
    if (next.phase === 'spot') {
      setMessage('Rep timing slipped. Spot Now before the rescue line closes.');
      pulseTrainerEmote('focus', 700);
      playAudioCue('spot-now', 0.9);
      return;
    }
    if (next.resolved) {
      resolveWorkoutSession(next);
      return;
    }
    const latestRep = next.repResults.at(-1);
    cuePresentationEffect(
      'rep-success',
      latestRep?.grade === 'rough' ? 'neutral' : 'success',
      latestRep?.grade === 'perfect'
        ? 'PERFECT REP'
        : latestRep?.grade === 'good'
          ? 'GOOD REP'
          : 'ROUGH REP',
    );
    setMessage(
      `${latestRep?.grade === 'perfect' ? 'Perfect' : latestRep?.grade === 'good' ? 'Good' : 'Rough'} timing. Rep ${next.currentRep}/${next.repCount} is moving.`,
    );
    playAudioCue(
      'rep-success',
      latestRep?.grade === 'perfect' ? 1 : 0.72,
    );
  }

  function useSteroid() {
    if (!activeBuddy) return;
    if (save.steroids <= 0) {
      setMessage('No Steroids left. Train more to earn one.');
      return;
    }

    const result = applySteroidReward({
      buddy: activeBuddy,
      trainer: save.trainer,
      steroids: save.steroids,
    });
    setSave((state) => ({
      ...state,
      trainer: result.trainer,
      steroids: result.steroids,
      team: state.team.map((buddy, index) =>
        index === state.activeIndex
          ? result.buddy
          : buddy,
      ),
    }));

    setMessage(
      `${activeBuddy.nickname} used 1 Steroid.${result.leveled ? ' Leveled up to Lv ' + result.buddy.level + '.' : ''} ` +
        `Form +${result.growth.form} · Mobility +${result.growth.mobility} · Volume +${result.growth.volume}.`,
    );
    pulseTrainerEmote('ready', 1400);
    cuePresentationEffect(
      result.leveled ? 'level-up' : 'rep-success',
      'success',
      result.leveled ? `LEVEL ${result.buddy.level}` : 'BOOST READY',
    );
    playAudioCue(result.leveled ? 'level-up' : 'rep-success', 1);
    pushLog(`Used Steroid on ${activeBuddy.nickname}.`);
  }

  function recoverWithRest() {
    if (!activeBuddy) {
      setMessage('No active buddy to recover.');
      return;
    }
    if (workoutSession && !workoutSession.resolved) {
      setMessage('Finish the active set before taking a recovery break.');
      return;
    }
    if (encounter || match) {
      setMessage('Finish battle flow before resting.');
      return;
    }
    if (!canRest) {
      setMessage(
        `Rest is in cooldown. ${Math.max(0, Math.ceil((nextRestAvailableMs - nowMs()) / 1000))}s until your next planned break.`,
      );
      return;
    }
    if (save.trainingFatigue <= 0 && activeBuddy.hp === activeBuddy.maxHp) {
      setMessage('You already feel sharp and recovered.');
      return;
    }

    const recovery = calculateRestRecovery({
      buddy: activeBuddy,
      trainingFatigue: save.trainingFatigue,
      deloadTokens: save.deloadTokens,
    });

    setSave((state) => ({
      ...state,
      trainingFatigue: recovery.trainingFatigue,
      visualProgression: applyDeepRecoveryToVisualProgression(
        state.visualProgression,
        state.bossGameplayTimeMs,
      ),
      deloadTokens: recovery.deloadTokens,
      machineTrainingHistory: {
        lastMachineId: null,
        repeatedUses: 0,
        masteryByMachineId:
          state.machineTrainingHistory.masteryByMachineId,
      },
      team: state.team.map((buddy, index) =>
        index === state.activeIndex
          ? recovery.buddy
          : buddy,
      ),
    }));
    setNextRestAvailableMs(nowMs() + FATIGUE_BALANCE.restCooldownMs);
    const deloadText = recovery.deloadGain > 0 ? ` and +${recovery.deloadGain} Deload` : '';
    setMessage(
      `${activeBuddy.nickname} takes a controlled reset. Recovery +${recovery.actualRecovery} fatigue, +${recovery.actualHeal} HP and +${recovery.statRecovery} load-readiness stat` +
      `${recovery.statRecovery === 1 ? '' : 's'}${deloadText}.`,
    );
    playAudioCue('recovery', 0.72);
    pulseTrainerEmote('ready', 900);
  }

  function beginEncounter() {
    if (activeZone.type === 'home') {
      setMessage('Leave Home Gym to scout a wild buddy.');
      return;
    }
    if (workoutSession && !workoutSession.resolved) {
      setMessage('Finish the current training set before scouting.');
      return;
    }
    if (encounter || match) {
      setMessage('Finish the active battle before scouting again.');
      return;
    }
    if (!activeBuddy) {
      setMessage('Pick an active buddy before scouting.');
      return;
    }
    const next = createOpponent(activeZone);
    setEncounter(next);
    setMatch(null);
    playAudioCue(
      next.creature.isExotic ? 'rare-encounter' : 'wild-alert',
      next.creature.isExotic ? 1.1 : 0.8,
    );
    setSave((state) => ({
      ...state,
      seenDex: state.seenDex.includes(next.creature.dex)
        ? state.seenDex
        : [...state.seenDex, next.creature.dex],
    }));
    setMessage(`${zoneNames[next.zoneId]}: wild ${next.creature.name} Lv.${next.level} appeared.`);
    pushLog(`Spawned ${next.creature.name} Lv.${next.level} (${zoneNames[next.zoneId]}).`);
    pulseTrainerEmote('neutral', 300);
  }

  function startMatch() {
    if (!encounter || !activeBuddy) return;
    if (match) return;
    const trainerPressure = trainerArenaPressure(trainer, activeMachine, activeZone);
    const buddyPressure = buddyArenaPressure(activeBuddy);
    const readiness = matchReadinessModifier(trainer, activeBuddy, activeZone);
    const challengeMachine = getBossChallengeMachine(encounter, activeZone);
    const machinePressure = bossChallengePressure(encounter, activeZone, activeMachine);
    const challengeSummary = bossChallengeSummary(encounter, activeZone, activeMachine);
    const challengeProfile = bossChallengeProfileForZone(activeZone.type, encounter);
    const challengeTier = bossChallengeTierFromEncounter(encounter, activeZone.type);
    const maxRounds = Math.max(4, challengeProfile.maxRounds - (encounterMachineBonus >= 4 ? 1 : 0));
    const openingBonus = encounter.isBoss ? challengeProfile.matchMachineBonus : 0;
    const bossDefinition = getBossById(encounter.bossId);
    const openingMeter = clamp(
      50 + (bossDefinition?.signatureRule.openingMeterShift ?? 0),
      CAPTURE_METER_MIN,
      CAPTURE_METER_MAX,
    );
    const activeCaptureTarget = encounter.isBoss
      ? bossCaptureTarget({
          gym: activeZone,
          encounter,
          isChallengeAligned: challengeSummary.isAligned,
          buddy: activeBuddy,
        })
      : WILD_CAPTURE_CONTROL_TARGET;
    const playerStamina = calculateCaptureStartingStamina({
      buddy: activeBuddy,
      trainingFatigue: save.trainingFatigue,
    });
    const opponentStamina = calculateOpponentStartingStamina(encounter);
    const opponentIntent = consumeRandomResult((randomState) =>
      selectCaptureOpponentIntent({
        encounter,
        meter: openingMeter,
        opponentStamina,
        playerMoveHistory: [],
        opponentMoveHistory: [],
        randomState,
      }),
    ).intent;
    const opening =
      encounter.isBoss && challengeMachine
        ? `${encounter.bossName} (${bossChallengeThresholdText(challengeSummary.tier, activeZone.type)}) is anchored on ${challengeMachine.name}. `
          + `Link ${challengeMachine.name} with ${encounter.bossRequiredMoveName ?? 'the required move'} for a ${challengeProfile.streakLimit}-action streak and +${openingBonus}% control recovery.`
        : 'Keep the pressure steady and rotate your grip each round.';
    const fatigueState = workoutReadinessLabel(clamp01(1 - save.trainingFatigue / MAX_TRAINING_FATIGUE));
    const pressureSummary = `Trainer pressure ${trainerPressure} · Buddy pressure ${buddyPressure} · Challenge bonus ${
      machinePressure >= 0 ? `+${machinePressure}` : `${machinePressure}`
    }`;
    const fatigueSummary = `Fatigue ${fatigueState}`;
    const readinessSummary = `${readiness.total >= 0 ? '+' : ''}${readiness.total} team-readiness edge`;

    setMatch({
      encounter,
      status: 'playing',
      round: 1,
      maxRounds,
      meter: openingMeter,
      playerStamina,
      opponentStamina,
      playerMoveHistory: [],
      opponentMoveHistory: [],
      opponentIntent,
      lastRound: null,
      pendingCapturedBuddy: null,
      isBossChallengeActive: encounter.isBoss && !!challengeMachine,
      bossChallengeMachineId: challengeMachine?.id ?? null,
      bossChallengeMachineName: challengeMachine?.name ?? null,
      bossChallengeMisses: 0,
      bossChallengeMatchStreak: 0,
      bossChallengeNearMisses: 0,
      lines: [
        'You and the wild Buddy lock grips at the Rally Table.',
        `${opening}`,
        ...(bossDefinition
          ? [
              `${bossDefinition.signatureRule.name}: ${bossDefinition.signatureRule.description}`,
              `Counterplay: ${bossDefinition.counterplay}`,
            ]
          : []),
        `Challenge difficulty: ${challengeTier.toUpperCase()} tier · ${challengeSummary.bonus >= 0 ? '+' : ''}${challengeSummary.bonus} machine bias.`,
        `${encounter.isBoss ? 'BOSS' : 'WILD'} pressure check: ${pressureSummary}.`,
        `${fatigueSummary}.`,
        `Readiness edge: ${readinessSummary}.`,
        `Boss lock target: ${activeCaptureTarget}% (higher is tighter ${activeCaptureTarget > 74 ? 'on this gym tier' : 'for boss only'}).`,
        `Stamina opens at ${playerStamina}/${opponentStamina}. Read the tell, choose a response, and secure ${activeCaptureTarget}% control before the pin check.`,
      ],
    });
    pulseTrainerEmote('focus', 1200);
    setMessage(encounter.isBoss ? `${encounter.bossName} engages the challenge machine.` : 'Arm-wrestle match started.');
    playAudioCue(encounter.isBoss ? 'boss-alert' : 'wild-alert', 1);
    updateMusic();
  }

function resolveMatch(
    meter: number,
    playerWonLine: string[],
    roundState?: Partial<Match>,
  ) {
    if (!match) return;
    if (!activeBuddy) return;

    const resolvingMatch: Match = { ...match, ...roundState, meter };
    const zone = AREAS.find((entry) => entry.id === match.encounter.zoneId) ?? activeZone;
    const activeMachineForMatch = activeMachine ?? getDefaultGymMachine(zone);
    const challengeMachine = getBossChallengeMachine(match.encounter, zone);
    const zoneMachine = activeMachineForMatch;
    const challengeProfile = bossChallengeProfileForZone(zone.type, match.encounter);
    const attempt = consumeRandomResult((randomState) =>
      calculateCaptureAttempt({
        match: resolvingMatch,
        gym: zone,
        machine: zoneMachine,
        trainer,
        buddy: activeBuddy,
        meter,
        trainingFatigue: save.trainingFatigue,
        randomState,
      }),
    );
    const challengePenaltyState = attempt.penalty;
    const captureTarget = attempt.captureTarget;

    const lines = [...playerWonLine];
    if (match.encounter.isBoss && challengeMachine && zoneMachine) {
      lines.push(
        zoneMachine.id === challengeMachine.id
          ? `You stay on ${challengeMachine.name}, matching the boss challenge`
          : `The boss requested ${challengeMachine.name}; you are fighting off that angle elsewhere.`,
      );
    }
    if (challengePenaltyState.isActive) {
      lines.push(
        `Challenge state: ${resolvingMatch.bossChallengeMatchStreak}/${challengeProfile.streakLimit} streak · ${resolvingMatch.bossChallengeMisses} misses · ${resolvingMatch.bossChallengeNearMisses} near misses.`,
      );
    }
    if (
      match.encounter.isBoss &&
      resolvingMatch.bossChallengeMisses >=
        challengeProfile.overloadMissLimit
    ) {
      lines.push('Challenge overload: misses stacked; return to the required machine or pressure escalates.');
    }
    if (
      match.encounter.isBoss &&
      resolvingMatch.isBossChallengeActive &&
      challengePenaltyState.penalty > 0.005
    ) {
      lines.push(`Capture penalty: -${Math.round(challengePenaltyState.penalty * 100)}% (streak bonus ${Math.round(challengePenaltyState.streakBonus * 100)}%).`);
    }
    if (match.encounter.isBoss) {
      const thresholdText =
        resolvingMatch.meter >= captureTarget ? 'met' : 'not met';
      lines.push(`Capture target ${captureTarget}% ${thresholdText}: current ${meter}%.`);
    }

    if (attempt.outcome === 'escape' || attempt.outcome === 'failed-pin') {
      const escape = attempt.outcome === 'escape';
      setMatch((current) =>
        current
          ? {
              ...current,
              ...roundState,
              status: escape ? 'escape' : 'failed-pin',
              lines: [
                ...lines,
                escape
                  ? 'The wild Buddy breaks the grip and clears the arena.'
                  : `The round ends below the ${captureTarget}% secure-control line. No pin is awarded.`,
              ],
              meter,
            }
          : current,
      );
      setMessage(
        escape
          ? match.encounter.isBoss
            ? 'The boss escaped the pin at the end.'
            : 'The wild buddy breaks loose.'
          : 'You missed the pin.',
      );
      playAudioCue('capture-failure', escape ? 1 : 0.9);
      cuePresentationEffect(
        'capture-failure',
        'failure',
        escape ? 'GRIP BROKEN' : 'PIN MISSED',
      );
      pulseTrainerEmote(escape ? 'drained' : 'grind', escape ? 1300 : 1100);
      setEncounter(escape ? null : encounter);
      return;
    }
    if (attempt.outcome === 'near-capture') {
      if (match.encounter.isBoss && challengePenaltyState.isActive && challengePenaltyState.nearWarn) {
        lines.push('Challenge discipline dropped. Re-center the required machine or your grip loses edge.');
      }
      setMatch((current) =>
        current
          ? {
              ...current,
              ...roundState,
              status: 'near-capture',
              meter,
              lines: [
                ...lines,
                'PIN WIN. The invitation nearly lands, but the wild Buddy chooses one more challenge.',
              ],
            }
          : current,
      );
      setMessage('The hold was almost won, but catch failed.');
      playAudioCue('capture-failure', 0.8);
      cuePresentationEffect('capture-failure', 'resisted', 'NEAR CAPTURE');
      pulseTrainerEmote('drained', 1200);
      return;
    }

    const newBuddy = consumeRandomResult((randomState) =>
      createCapturedBuddy({
        species: match.encounter.creature,
        level: match.encounter.level,
        capturedAtMs: Date.now(),
        names: FANCY_NAMES,
        randomState,
      }),
    ).buddy;

    const placement = planCapturePartyPlacement(
      save.team,
      newBuddy,
      TEAM_SIZE,
    );
    const bossDefinition = getBossById(match.encounter.bossId);
    const bossVictoryReward =
      match.encounter.isBoss && bossDefinition
        ? consumeRandomResult((randomState) =>
            resolveBossVictoryReward({
              rewardTable: bossDefinition.rewardTable,
              team: placement.team,
              activeIndex: save.activeIndex,
              trainingFatigue: save.trainingFatigue,
              workoutMomentum: save.workoutMomentum,
              deloadTokens: save.deloadTokens,
              randomState,
            }),
          )
        : null;
    const bossRewardLine = bossVictoryReward
      ? `Boss rewards: +${bossVictoryReward.reward.buddyXp} active Buddy XP · ${bossVictoryReward.reward.fatigueRecovered} fatigue recovered · +${bossVictoryReward.reward.momentumGained} momentum · +${bossVictoryReward.reward.deloadTokensGained} Deload.`
      : null;
    const markBossRewardForState = (state: SaveData) => {
      const schedule = state.bossSchedules[zone.id];
      if (
        !match.encounter.isBoss ||
        !schedule ||
        !match.encounter.bossScheduleCycle
      ) {
        return null;
      }
      return markBossCycleRewarded(
        schedule,
        match.encounter.bossScheduleCycle,
      );
    };
    if (placement.kind === 'full-party') {
      if (match.encounter.isBoss) {
        setSave((state) => {
          const marked = markBossRewardForState(state);
          const applyReward = Boolean(
            marked?.awarded && bossVictoryReward,
          );
          return {
            ...state,
            team: applyReward ? bossVictoryReward!.team : state.team,
            trainingFatigue: applyReward
              ? bossVictoryReward!.trainingFatigue
              : state.trainingFatigue,
            workoutMomentum: applyReward
              ? bossVictoryReward!.workoutMomentum
              : state.workoutMomentum,
            deloadTokens: applyReward
              ? bossVictoryReward!.deloadTokens
              : state.deloadTokens,
            caughtDex: state.caughtDex.includes(match.encounter.creature.dex)
              ? state.caughtDex
              : [...state.caughtDex, match.encounter.creature.dex],
            bossSchedules: marked
              ? {
                  ...state.bossSchedules,
                  [zone.id]: marked.schedule,
                }
              : state.bossSchedules,
          };
        });
      }
      setMatch((current) =>
        current
          ? {
              ...current,
              ...roundState,
              status: 'full-party',
              meter,
              pendingCapturedBuddy: placement.pendingBuddy,
              lines: [
                ...lines,
                'PIN WIN. The capture succeeds, but all six party positions are occupied.',
                ...(bossRewardLine ? [bossRewardLine] : []),
                'Choose a Buddy to rotate out, or let the new Buddy return to the route.',
              ],
            }
          : current,
      );
      if (!match.encounter.isBoss) {
        setSave((state) => ({
          ...state,
          caughtDex: state.caughtDex.includes(match.encounter.creature.dex)
            ? state.caughtDex
            : [...state.caughtDex, match.encounter.creature.dex],
        }));
      }
      setMessage('Capture secured. Choose how to resolve the full party.');
      playAudioCue('team-full', 0.9);
      cuePresentationEffect('capture-success', 'success', 'CAPTURE HELD');
      return;
    }

    setSave((state) => {
      const marked = markBossRewardForState(state);
      const applyReward = Boolean(marked?.awarded && bossVictoryReward);
      const rewardedTeam = applyReward
        ? bossVictoryReward!.team
        : placement.team;
      return {
        ...state,
        team: rewardedTeam,
        trainingFatigue: applyReward
          ? bossVictoryReward!.trainingFatigue
          : state.trainingFatigue,
        workoutMomentum: applyReward
          ? bossVictoryReward!.workoutMomentum
          : state.workoutMomentum,
        deloadTokens: applyReward
          ? bossVictoryReward!.deloadTokens
          : state.deloadTokens,
        caughtDex: state.caughtDex.includes(encounter!.creature.dex)
          ? state.caughtDex
          : [...state.caughtDex, encounter!.creature.dex],
        activeIndex:
          state.activeIndex >= rewardedTeam.length
            ? rewardedTeam.length - 1
            : state.activeIndex,
        bossSchedules: marked
          ? {
              ...state.bossSchedules,
              [zone.id]: marked.schedule,
            }
          : state.bossSchedules,
      };
    });

    setMatch((current) =>
      current
        ? {
            ...current,
            ...roundState,
            status: 'captured',
            meter,
            pendingCapturedBuddy: null,
            lines: [
              ...lines,
              'PIN WIN. Your control holds through the count.',
              `CAPTURE COMPLETE. ${encounter!.creature.name} accepts the challenge bond and joins your party.`,
              ...(bossRewardLine ? [bossRewardLine] : []),
            ],
          }
        : current,
    );
    setEncounter(null);
    playAudioCue('capture-success', 1.1);
    cuePresentationEffect('capture-success', 'success', 'CAPTURE COMPLETE');
    pulseTrainerEmote('victory', 1600);
    setMessage(
      `Captured ${encounter!.creature.name} as ${newBuddy.nickname}.${bossRewardLine ? ` ${bossRewardLine}` : ''}`,
    );
    pushLog(`Captured ${encounter!.creature.name} Lv.${encounter!.level}.`);
  }

  function replacePartySlotAfterCapture(index: number) {
    if (
      !match ||
      match.status !== 'full-party' ||
      !match.pendingCapturedBuddy
    ) {
      return;
    }
    const capturedBuddy = match.pendingCapturedBuddy;
    const rotatedBuddy = save.team[index];
    if (!rotatedBuddy) return;
    setSave((state) => ({
      ...state,
      team: replacePartyBuddy(state.team, index, capturedBuddy),
      activeIndex: state.activeIndex,
    }));
    setMatch((current) =>
      current
        ? {
            ...current,
            status: 'captured',
            pendingCapturedBuddy: null,
            lines: [
              ...current.lines,
              `${rotatedBuddy.nickname} rotates to recovery while ${capturedBuddy.nickname} takes party slot ${index + 1}.`,
            ],
          }
        : current,
    );
    setEncounter(null);
    setMessage(`${capturedBuddy.nickname} joined the party.`);
    playAudioCue('capture-success', 1);
    pushLog(
      `${capturedBuddy.nickname} replaced ${rotatedBuddy.nickname} after a full-party capture.`,
    );
  }

  function releaseFullPartyCapture() {
    if (
      !match ||
      match.status !== 'full-party' ||
      !match.pendingCapturedBuddy
    ) {
      return;
    }
    const releasedBuddy = match.pendingCapturedBuddy;
    setMatch((current) =>
      current
        ? {
            ...current,
            pendingCapturedBuddy: null,
            lines: [
              ...current.lines,
              `${releasedBuddy.nickname} returns to the route with the encounter recorded in the Index.`,
            ],
          }
        : current,
    );
    setEncounter(null);
    setMessage(`${releasedBuddy.nickname} returned to the route.`);
    pushLog(`Full-party capture recorded; ${releasedBuddy.nickname} returned safely.`);
  }

  function performMove(move: Move) {
    if (
      !match ||
      !match.encounter ||
      match.status !== 'playing' ||
      !activeBuddy ||
      captureAnimation
    ) {
      return;
    }

    const zone = AREAS.find((entry) => entry.id === match.encounter.zoneId) ?? activeZone;
    const selectedMachine = activeMachine ?? getDefaultGymMachine(zone);
    const isForcedChallengeRecovery = Boolean(isMatchChallengeForcedRecovery);
    const moveResult = consumeRandomResult((randomState) =>
      calculateCaptureMove({
        match,
        gym: zone,
        selectedMachine,
        trainer,
        buddy: activeBuddy,
        trainingFatigue: save.trainingFatigue,
        move,
        isForcedChallengeRecovery,
        challengeStressPercent: activeMatchChallengeStress.percent,
        randomState,
      }),
    );
    const {
      challengeMachine,
      isChallengeMachine,
      isChallengeAction,
      isNearMiss,
      signatureEffect,
      profile: challengeProfile,
      moveAlignmentBonus,
      moveMismatchPenalty,
      nextMisses,
      nextNearMisses,
      nextMatchStreak,
      delta,
      nextMeter,
      round,
      playerStamina,
      opponentStamina,
      playerMoveHistory,
      opponentMoveHistory,
      opponentIntent,
      roundSummary,
    } = moveResult;
    const opponentMove =
      MOVES.find((entry) => entry.id === roundSummary.opponentMoveId) ??
      MOVES[1]!;

    if (captureAnimationTimerRef.current) {
      clearTimeout(captureAnimationTimerRef.current);
    }
    setCaptureAnimation({
      moveId: move.id,
      tone:
        roundSummary.counterState === 'counter'
          ? 'counter'
          : roundSummary.meterDelta >= 0
            ? 'advance'
            : 'resisted',
    });
    cuePresentationEffect(
      'arm-impact',
      roundSummary.counterState === 'counter'
        ? 'counter'
        : roundSummary.meterDelta >= 0
          ? 'advance'
          : 'resisted',
      move.title.toUpperCase(),
    );
    const impactDuration = save.accessibility.reducedMotion
      ? PRESENTATION_EFFECT_TIMING.reducedMotionSequenceMs
      : captureSpeed.animationMs;
    captureAnimationTimerRef.current = window.setTimeout(() => {
      setCaptureAnimation(null);
      captureAnimationTimerRef.current = null;
    }, impactDuration);

    setSave((state) => ({
      ...state,
      trainingFatigue: moveResult.trainingFatigue,
    }));
    const challengeAlignmentNote =
      challengeMachine && match.encounter.isBoss && match.isBossChallengeActive
        ? isChallengeAction
          ? `Complete action: ${challengeMachine.name} + ${match.encounter.bossRequiredMoveName ?? move.title}.`
          : isNearMiss
            ? `Partial action: ${
                isChallengeMachine
                  ? match.encounter.bossRequiredMoveName ?? 'the required move'
                  : challengeMachine.name
              } was still missing.`
            : `Challenge break: ${challengeMachine.name} + ${match.encounter.bossRequiredMoveName ?? 'the required move'} was expected.`
        : null;
    const line =
      roundSummary.meterDelta >= 6
        ? `${move.title} takes a clean control edge.`
        : roundSummary.meterDelta >= 0
          ? `${move.title} holds center without overcommitting.`
          : `${opponentMove.title} reads the exchange and pushes control back.`;
    const counterLine =
      roundSummary.counterState === 'counter'
        ? `${move.title} answers the tell and earns the counter edge.`
        : roundSummary.counterState === 'countered'
          ? `${opponentMove.title} counters your chosen line.`
          : 'Neither move owns the matchup; preparation and execution decide it.';

    const nextLines = [
      ...match.lines,
      `Round ${match.round}: ${move.title} meets ${opponentMove.title}. ${line}`,
      counterLine,
      `Control ${nextMeter}% · stamina ${playerStamina}/${opponentStamina} · next tell: ${opponentIntent.tell}`,
      ...(challengeAlignmentNote
        ? [
            isChallengeAction
              ? `${challengeAlignmentNote} +${moveAlignmentBonus} bonus. ${nextMatchStreak >= challengeProfile.streakLimit ? 'Streak lock active.' : ''}`
              : `${challengeAlignmentNote} -${moveMismatchPenalty} penalty.`,
          ]
        : []),
      ...(signatureEffect.active && signatureEffect.name
        ? [
            `${signatureEffect.name}: ${signatureEffect.warning ?? 'The boss signature rule activates.'}`,
          ]
        : []),
      ...(isForcedChallengeRecovery
        ? ['You stay in overload: only the required machine can quickly recover pressure.']
        : []),
      ...(challengeMachine
        ? [`Challenge pressure: ${nextMisses}/${challengeProfile.overloadMissLimit} misses to overload · ${nextNearMisses} near-miss points.`]
        : []),
      `Round state: meter ${nextMeter}%${
        isChallengeAction ? '' : ` · challenge misses ${nextMisses}`
      }.`,
    ];
    if (roundSummary.repetitionPenalty > 0) {
      nextLines.push(
        `Repeat read: familiar move history reduced pressure by ${roundSummary.repetitionPenalty}.`,
      );
    }
    if (nextMeter >= activeMatchCaptureTarget - 6) {
      nextLines.push(
        `Secure-control line is close at ${activeMatchCaptureTarget}%.`,
      );
    }
    if (nextMeter <= 28) {
      nextLines.push('Danger: hold is fading. Keep it moving.');
    }
    playAudioCue(
      delta >= 0 ? 'capture-advance' : 'capture-resisted',
      0.5 + Math.abs(delta) / 20,
    );

    if (nextMeter >= 76) {
      pulseTrainerEmote('level', 900);
    } else if (
      match.encounter.isBoss &&
      match.bossChallengeMisses >= challengeProfile.overloadMissLimit
    ) {
      pulseTrainerEmote('drained', 850);
    } else if (nextMeter <= 34) {
      pulseTrainerEmote('focus', 800);
    } else {
      pulseTrainerEmote('grind', 700);
    }

    if (moveResult.shouldResolve) {
      resolveMatch(nextMeter, nextLines, {
        round,
        meter: nextMeter,
        playerStamina,
        opponentStamina,
        playerMoveHistory,
        opponentMoveHistory,
        opponentIntent,
        lastRound: roundSummary,
        bossChallengeMisses: nextMisses,
        bossChallengeMatchStreak: nextMatchStreak,
        bossChallengeNearMisses: nextNearMisses,
      });
      return;
    }

    setMatch((current) =>
      current
            ? {
            ...current,
            round,
            meter: nextMeter,
            playerStamina,
            opponentStamina,
            playerMoveHistory,
            opponentMoveHistory,
            opponentIntent,
            lastRound: roundSummary,
            bossChallengeMisses: nextMisses,
            bossChallengeMatchStreak: nextMatchStreak,
            bossChallengeNearMisses: nextNearMisses,
            lines: nextLines,
          }
            : current,
    );
    setMessage(
      isForcedChallengeRecovery
        ? 'Overload lock active — return to the required machine before your next controlled pull.'
        : 'Round complete. Push once more.',
    );
  }

  function hpPercent(value: number, max: number) {
    return Math.round((value / max) * 100);
  }

  function handlePresentationAction(action: InputAction) {
    if (
      action === 'menu' ||
      action === 'pause' ||
      action === 'cancel' ||
      action === 'debug-toggle'
    ) {
      return;
    }
    const gameplayAction = action === 'confirm' ? 'interact' : action;
    if (workoutSession) {
      if (gameplayAction === 'interact' && !workoutSession.resolved) {
        performWorkoutAction();
      }
      return;
    }
    const direction = inputActionToDirection(gameplayAction);
    if (direction && (encounter || match || isTraveling)) return;

    if (gameplayAction === 'interact' && encounter && !match) {
      startMatch();
      return;
    }
    if (match?.status === 'playing') {
      const moveIndex =
        gameplayAction === 'ability-2'
          ? 1
          : gameplayAction === 'ability-3'
            ? 2
            : gameplayAction === 'interact' || gameplayAction === 'ability-1'
              ? 0
              : -1;
      const move = MOVES[moveIndex];
      if (move) performMove(move);
      return;
    }

    const now = nowMs();
    const result = resolveOverworldAction({
      state: overworldState,
      action: gameplayAction,
      now,
      progression: overworldProgression,
    });
    if (result.state !== overworldState) {
      setOverworldState(result.state);
      setTrainerFacing(result.state.facing);
    }

    result.events.forEach((event) => {
      if (event.type === 'blocked') {
        setMessage(`The ${event.direction} path is blocked.`);
      }
      if (event.type === 'nothing-to-interact') {
        setMessage('Nothing is within reach. Face a door, sign, machine, or trainer.');
      }
      if (event.type === 'interaction') {
        if (event.interactable.machineId) {
          selectMachine(event.interactable.machineId);
        }
        if (event.interactable.kind === 'recovery') {
          recoverWithRest();
        } else {
          setMessage(event.interactable.message);
        }
      }
      if (event.type === 'encounter-check') {
        setMessage(
          event.area.rarity === 'rare'
            ? `A rare ${event.area.rewardQuality} signal flashes through the turf.`
            : 'The marked pulse turf shifts. Stay ready for a competitive grip.',
        );
        trySpawnRouteEncounter(
          getGymById(event.area.gymId),
          event.area.encounterBoost,
          event.area.routeName,
        );
        setLastRouteEncounterMs(now);
      }
      if (event.type === 'locked-transition') {
        setMessage(`Route locked: ${event.requirement.description}`);
      }
      if (event.type === 'transition') {
        setEncounter(null);
        setMatch(null);
        setSave((state) => {
          const targetZoneId = event.transition.targetZoneId ?? state.activeZoneId;
          return {
            ...state,
            activeZoneId: targetZoneId,
            unlockedZoneIds: event.transition.targetZoneId
              ? unlockAdjacentZones(state.unlockedZoneIds, targetZoneId)
              : state.unlockedZoneIds,
            visitedZoneIds: event.transition.targetZoneId
              ? [...new Set([...state.visitedZoneIds, targetZoneId])]
              : state.visitedZoneIds,
            trainingFatigue: applyFatigueChange(
              state.trainingFatigue,
              event.transition.fatigueCost,
            ),
          };
        });
        const destination = getOverworldMap(event.toLocationId);
        setMessage(
          `${destination.name} reached via ${event.transition.routeName}. Fatigue +${event.transition.fatigueCost.toFixed(2)}.`,
        );
        playAudioCue('route-transition', 0.45);
      }
    });
  }

  const presentationActionLabel = match?.status === 'playing'
    ? MOVES[0]?.title ?? 'Pull'
    : encounter
      ? 'Grip up'
      : facingOverworldInteractable?.label ?? 'Interact';
  const gamePresentationSnapshot = useMemo<
    Omit<GamePresentationSnapshot, 'motion'>
  >(
    () => ({
      activeZoneName: activeOverworldMap.name,
      activeZoneType:
        activeOverworldMap.kind === 'route' ? 'route' : activeZone.type,
      buddyHp: activeBuddy?.hp ?? 0,
      buddyMaxHp: activeBuddy?.maxHp ?? 0,
      buddyName: activeBuddy?.nickname ?? '',
      encounterActive: Boolean(encounter || match),
      effect: presentationEffect,
      defeatedGymIds: overworldProgression.defeatedGymIds,
      facing: overworldState.facing,
      fatigueRatio,
      locationId: overworldState.locationId,
      movementSequence: overworldState.movementSequence,
      playerTileX: overworldState.position.x,
      playerTileY: overworldState.position.y,
      transitionSequence: overworldState.transitionSequence,
      trainerEmote: activeEmote,
      trainerInitial: trainer.name?.[0]?.toUpperCase() ?? 'T',
      trainerColors: {
        hair: trainer.hair,
        shirt: trainer.top,
        skin: trainer.skin,
      },
      trainerAppearance: trainerVisualPresentation.appearance,
      trainerIdleSequence: Math.floor(save.bossGameplayTimeMs / 1_000),
      trainerPumpIntensity: trainerVisualPresentation.pumpIntensity,
      trainerRecovery: trainerVisualPresentation.recovery,
      visitedZoneIds: overworldProgression.visitedZoneIds,
    }),
    [
      activeBuddy?.hp,
      activeBuddy?.maxHp,
      activeBuddy?.nickname,
      activeEmote,
      activeOverworldMap.kind,
      activeOverworldMap.name,
      activeZone.type,
      encounter,
      fatigueRatio,
      match,
      overworldProgression.defeatedGymIds,
      overworldProgression.visitedZoneIds,
      overworldState.facing,
      overworldState.locationId,
      overworldState.movementSequence,
      overworldState.position.x,
      overworldState.position.y,
      overworldState.transitionSequence,
      presentationEffect,
      trainer.hair,
      trainerVisualPresentation.appearance,
      trainerVisualPresentation.pumpIntensity,
      trainerVisualPresentation.recovery,
      save.bossGameplayTimeMs,
      trainer.name,
      trainer.skin,
      trainer.top,
    ],
  );

  return showStarterSetup ? renderStarterSetup() : (
    <div
      className="app-shell"
      data-gameplay-paused={gameplayPaused ? 'true' : 'false'}
    >
      {zoneTransit && (
        <div
          className={`zone-transition zone-transition-${save.captureBattleSpeed}`}
          role="dialog"
          aria-modal="true"
          aria-label={`Traveling from ${zoneTransit.from} to ${zoneTransit.to}`}
        >
          <div className="zone-transition-card">
            <div className="zone-transition-row">
              <span>{zoneTransit.icon}</span>
              <span>{zoneTransit.from}</span>
              <span>→</span>
              <span>{zoneTransit.to}</span>
            </div>
            <div className="zone-transition-subrow">
              <p className="small-note">Fresh gym air, new layout, and a different pressure profile load in.</p>
              {zoneTransit.routeName ? <p className="small-note">Route: {zoneTransit.routeName}</p> : null}
              {zoneTransit.routeFatigue !== undefined ? (
                <p className="small-note">Route fatigue: {zoneTransit.routeFatigue.toFixed(1)}</p>
              ) : null}
              {zoneTransit.routeEncounterBoost ? (
                <p className="small-note">Route scouting bonus: +{Math.round(zoneTransit.routeEncounterBoost * 100)}%</p>
              ) : null}
              {zoneTransit.routeScoutChance !== undefined ? (
                <p className="small-note">
                  Approx. route scouting chance: {Math.round(zoneTransit.routeScoutChance * 100)}%
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="zone-transition-skip"
              onClick={skipZoneTransit}
            >
              Continue now
            </button>
          </div>
        </div>
      )}
      {tutorialActive && (
        <div className="tutorial-overlay">
          <div className="tutorial-card">
            <div className="panel-head-row">
              <h2>Tutorial</h2>
              <button className="secondary-btn" onClick={() => setShowRoadmap((open) => !open)}>
                {showRoadmap ? 'Hide plan' : 'Roadmap'}
              </button>
            </div>
            <p className="small-note">Step {Math.min(save.tutorialStep + 1, TUTORIAL_STEPS.length)} of {TUTORIAL_STEPS.length}</p>
            <p>{currentTutorialText}</p>
            <p className="small-note">You can still play, but finishing tutorial gives full control tips.</p>
            <div className="action-row">
              <button className="primary-btn" onClick={nextTutorialStep}>
                {save.tutorialStep >= TUTORIAL_STEPS.length - 1 ? 'Finish Tutorial' : 'Next'}
              </button>
              <button className="secondary-btn" onClick={finishTutorialNow}>
                Skip
              </button>
            </div>
            {showRoadmap && (
              <div className="roadmap">
                <h3>Feature cadence plan</h3>
                <small>Phase 1 (now): Controls, machine depth, beginner combat.</small>
                <small>Phase 2 (+2h): Boss prep items, gym challenges, rewards.</small>
                <small>Phase 3 (+4h): Late-game forms, rare trainer events.</small>
                <small>Phase 4 (+6h): Full gym-boss meta and balancing pass.</small>
              </div>
            )}
          </div>
        </div>
      )}
      <header className="top-banner">
        <h1>GYM BUDDIES</h1>
        <p>Original handheld-era fitness adventure, open-world gym travel, and competitive captures.</p>
        <div className="panel-head-row">
          <span className="chip">Trainer: {trainer.name}</span>
          <span className="chip">Fatigue {trainingFatigueLevel} · {percent(1 - fatigueRatio)}</span>
          <div className="action-row">
            <button className="secondary-btn micro-btn" onClick={reopenTrainerSetup}>
              Edit Trainer
            </button>
            <button className="secondary-btn micro-btn" onClick={requestJourneyRestart}>
              Restart Journey
            </button>
            <button className="secondary-btn" onClick={resetTutorial}>
              Restart Tutorial
            </button>
          </div>
        </div>
        <div className="audio-controls">
          <button
            className="secondary-btn micro-btn"
            onClick={() => setAudioEnabled(!save.audio.enabled)}
            aria-label={
              save.audio.enabled ? 'Mute all audio' : 'Unmute all audio'
            }
            aria-pressed={!save.audio.enabled}
          >
            {save.audio.enabled ? '🔊 Audio: On' : '🔇 Audio: Muted'}
          </button>
          <label className="audio-control">
            <span>Music {Math.round(save.audio.musicVolume * 100)}%</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={save.audio.musicVolume}
              onChange={(event) => setMusicVolume(Number(event.target.value))}
            />
          </label>
          <label className="audio-control">
            <span>SFX {Math.round(save.audio.sfxVolume * 100)}%</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={save.audio.sfxVolume}
              onChange={(event) => setSfxVolume(Number(event.target.value))}
            />
          </label>
          <label className="audio-control">
            <span>Battle speed</span>
            <select
              value={save.captureBattleSpeed}
              onChange={(event) =>
                setCaptureBattleSpeed(event.target.value as CaptureBattleSpeed)
              }
              aria-label="Capture battle speed"
            >
              {CAPTURE_BATTLE_SPEEDS.map((speed) => (
                <option key={speed.id} value={speed.id}>
                  {speed.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <SaveManagementPanel
          canRestorePrevious={previousSaveAvailable}
          loadIssues={saveLoadIssues}
          loadMessage={saveLoadMessage}
          onImportJson={importJourneyJson}
          onRestorePrevious={restorePreviousJourney}
          save={save}
        />
        {import.meta.env.DEV ? (
          <AudioTestPanel
            onPlayCue={playAudioCue}
            onPlayTrack={auditionAudioTrack}
            onRestoreGameMix={() => {
              void activateAudioEngine();
            }}
            onStopMusic={() => getAudioEngine().stopMusic()}
          />
        ) : null}
      </header>

      <GamePresentation
        accessibility={save.accessibility}
        actionLabel={presentationActionLabel}
        battleSpeed={save.captureBattleSpeed}
        dialogue={message}
        dialoguePortrait={dialoguePortrait}
        directionAvailability={overworldDirectionAvailability}
        effectSkippable={Boolean(captureAnimation || bossEntrance || zoneTransit)}
        keyboardBindings={save.input.keyboardBindings}
        visualProgression={save.visualProgression.preferences}
        movementDisabled={Boolean(
          isTraveling ||
            encounter ||
            match ||
            workoutSession ||
            restartConfirmationOpen ||
            physiqueReviewOpen,
        )}
        onAction={handlePresentationAction}
        onAccessibilityChange={setAccessibilitySettings}
        onBattleSpeedChange={setCaptureBattleSpeed}
        onKeyboardBindingsChange={setKeyboardBindings}
        onPauseChange={handleGameplayPauseChange}
        onSkipEffect={skipPresentationSequence}
        onVisualProgressionChange={setVisualProgressionPreferences}
        partyCount={save.team.length}
        primaryActionDisabled={Boolean(
          restartConfirmationOpen ||
            captureAnimation ||
            (match && match.status !== 'playing'),
        )}
        snapshot={gamePresentationSnapshot}
      />

      <main className="game-grid">
        <section className="panel">
          <div className="panel-head-row">
            <h2>Gym Map</h2>
            <span className="chip">Party {save.team.length}/{TEAM_SIZE}</span>
          </div>
          <div className="zone-hero">
            <div>
              <div className="zone-hero-title">
                {zoneVibe.icon} {activeZone.name}
              </div>
              <p className="small-note">
                {zoneVibe.mood} · {zoneVibe.theme}
              </p>
            </div>
            <span className="chip">Zone Accent: {zoneVibe.accent}</span>
          </div>
          <p className="small-note">Current: {activeZone.name}</p>
          <section
            className={`boss-availability boss-availability-${activeBossAvailability.status}`}
            aria-label={`${activeZone.name} boss availability`}
          >
            <div>
              <strong>
                Boss challenge ·{' '}
                {activeBossAvailability.status === 'ready'
                  ? 'Ready now'
                  : `${bossTicker} active play`}
              </strong>
              <small>
                Possible challengers:{' '}
                {activeGymBosses.map((boss) => boss.name).join(' or ')}
              </small>
              <small>
                Repeat challenges recharge during visible gameplay; exploring,
                training, and battles all count.
              </small>
            </div>
            <button
              className="secondary-btn boss-challenge-btn"
              onClick={() => startBossChallenge(activeZone)}
              disabled={
                activeBossAvailability.status !== 'ready' ||
                Boolean(encounter || match || workoutSession)
              }
            >
              {activeBossAvailability.status === 'ready'
                ? 'Answer Boss Challenge'
                : `Available in ${bossTicker}`}
            </button>
          </section>
          <p className="small-note">{activeZone.blurb}</p>
          <p className="small-note">
            Move with WASD or arrow keys: {movementHint || 'No exits available'}
          </p>
           <p className="small-note">
             Route scouting cooldown: {routeScoutCooldownRemaining <= 0 ? 'ready' : `${(routeScoutCooldownRemaining / 1000).toFixed(1)}s`}
           </p>
           <p className="small-note">Stride lock: {worldMoveBlocked ? `${(Math.max(0, worldMoveCooldownRemaining) / 1000).toFixed(1)}s` : 'ready'}</p>
          <div className="world-dpad">
            <button
              className={`dpad-btn ${connectedWalkByDirection.up ? 'dpad-available' : 'dpad-blocked'}`}
              onClick={() => moveTrainerByDirection('up')}
              disabled={isTraveling || worldMoveBlocked || !connectedWalkByDirection.up}
            >
              ▲
            </button>
            <button
              className={`dpad-btn ${connectedWalkByDirection.left ? 'dpad-available' : 'dpad-blocked'}`}
              onClick={() => moveTrainerByDirection('left')}
              disabled={isTraveling || worldMoveBlocked || !connectedWalkByDirection.left}
            >
              ◀
            </button>
            <button
              className={`dpad-btn ${connectedWalkByDirection.down ? 'dpad-available' : 'dpad-blocked'}`}
              onClick={() => moveTrainerByDirection('down')}
              disabled={isTraveling || worldMoveBlocked || !connectedWalkByDirection.down}
            >
              ▼
            </button>
            <button
              className={`dpad-btn ${connectedWalkByDirection.right ? 'dpad-available' : 'dpad-blocked'}`}
              onClick={() => moveTrainerByDirection('right')}
              disabled={isTraveling || worldMoveBlocked || !connectedWalkByDirection.right}
            >
              ▶
            </button>
          </div>
           {connectedWalks.length > 0 ? (
              <div className="world-move-controls">
              {connectedWalks.map(({ direction, destinationZone, routeName, routeFatigue, encounterBoost }) => (
                <button
                  key={`${direction}-${destinationZone ?? 'path'}`}
                  className="secondary-btn micro-btn"
                  onClick={() => moveTrainerByDirection(direction)}
                  disabled={isTraveling || worldMoveBlocked}
                >
                  {direction.toUpperCase()} · {routeName} → {destinationZone ? zoneNames[destinationZone] ?? destinationZone : 'Path'} · +{routeFatigue.toFixed(1)} fatigue{encounterBoost ? ` · +${Math.round(encounterBoost * 100)}% encounter` : ''}
                </button>
              ))}
            </div>
          ) : null}
          {worldMoveBlocked ? (
            <div className="world-move-progress-wrap">
              <div className="world-move-progress">
                <div className="world-move-progress-fill" style={{ width: `${Math.round(worldMovePercent * 100)}%` }} />
              </div>
              <small className="small-note">
                Stride lock: {Math.max(0, worldMoveCooldownRemaining) / WORLD_MOVE_COOLDOWN_MS < 0.01
                  ? 'free'
                  : `${(Math.ceil(worldMoveCooldownRemaining / 10) / 100).toFixed(2)}s`}
              </small>
            </div>
          ) : null}
          <div className="world-route-list">
            <div className="world-route-pill">
              Available routes:{' '}
              {connectedZones.map((zoneId) => zoneNames[zoneId] ?? zoneId).join(' · ') || 'none'}
            </div>
            <div
              className="world-mini-grid world-overworld-map"
              style={{
                width: WORLD_GRID_WIDTH * WORLD_TILE_PITCH + WORLD_GRID_PADDING * 2,
                height: WORLD_GRID_HEIGHT * WORLD_TILE_PITCH + WORLD_GRID_PADDING * 2,
              }}
            >
              {Array.from({ length: WORLD_GRID_WIDTH * WORLD_GRID_HEIGHT }, (_, index) => {
                const x = index % WORLD_GRID_WIDTH;
                const y = Math.floor(index / WORLD_GRID_WIDTH);
                const point = { x, y };
                const walkable = isWorldTileWalkable(point);
                if (!walkable) return null;
                const zoneId = worldTileZoneId(point);
                const base = worldTileToStyle(point);
                return (
                  <span
                    key={`cell-${x}-${y}`}
                    className={`world-grid-cell ${zoneId ? 'world-gym-tile' : 'world-route-tile'}`}
                    style={{ left: base.left, top: base.top }}
                    aria-hidden="true"
                  />
                );
              })}
              {AREAS.map((zone) => {
                const mapPos = mapPointForZone(zone.id);
                if (!mapPos) return null;
                const isActive = zone.id === save.activeZoneId;
                const linked = connectedZones.includes(zone.id);
                const isUnlocked = isZoneUnlocked(zone.id);
                const isRouteReady = (linked && isUnlocked) || isActive;
                const nearby = WORLD_PATH_LINKS.some(([from, to]) => [from, to].includes(zone.id) && [from, to].includes(save.activeZoneId));
                return (
                  <button
                    key={`main-${zone.id}`}
                    className={`world-mini-node ${zone.type} ${isActive ? 'active' : ''} ${isRouteReady ? 'route-ready' : 'route-locked'} ${
                      nearby ? 'route-nearby' : ''
                    }`}
                    style={{
                      left: mapPos.left - (WORLD_TILE_PX / 2),
                      top: mapPos.top - (WORLD_TILE_PX / 2),
                    }}
                    onClick={() => travelToZone(zone.id)}
                    disabled={!isRouteReady || isTraveling || worldMoveBlocked}
                  >
                    {zone.type === 'home' ? '🏠' : '🏋'}
                      <small>{zone.name}</small>
                      <small>{zone.blurb}</small>
                      {!isUnlocked && !isActive ? '🔒' : ''}
                  </button>
                );
              })}
              {WORLD_ROUTE_PATHS.map((route) => {
                const signPos = routeSignPosition(route);
                if (!signPos) return null;
                return (
                  <div
                    key={`${route.from}-${route.to}-sign`}
                    className="world-route-sign"
                    style={{
                      left: signPos.left,
                      top: signPos.top,
                    }}
                    title={`${route.routeName}: +${route.travelFatigue.toFixed(1)} fatigue · +${Math.round(
                      route.encounterBoost * 100,
                    )}% scouting`}
                  >
                    {route.routeName}
                  </div>
                );
              })}
              <div
                className={`world-mini-trainer trainer-facing-${trainerFacing}`}
                style={{
                  left: worldTileToStyle(worldPlayerPos).left - (WORLD_TILE_PX / 3),
                  top: worldTileToStyle(worldPlayerPos).top - (WORLD_TILE_PX / 3),
                }}
              >
                {trainer.name?.[0]?.toUpperCase() ?? 'T'}
              </div>
            </div>
            <div className="gym-grid">
              {AREAS.map((area) => {
                const linked = connectedZones.includes(area.id);
                const isActive = save.activeZoneId === area.id;
                const isUnlocked = isZoneUnlocked(area.id);
                const isHomeNode = area.id === 'home';
                const routeProfile = routeProfileFromZones(save.activeZoneId, area.id);
                const routeDetail = routeProfile
                  ? `${routeProfile.routeName} • +${routeProfile.travelFatigue.toFixed(1)} fatigue · +${Math.round(routeProfile.encounterBoost * 100)}% scouting`
                  : isActive
                    ? 'Current location'
                    : linked
                      ? 'Connected'
                      : 'Route not yet unlocked';
                const topMachines = area.machines
                  .slice(0, 2)
                  .map((entry) => entry.name.split(' ').at(0))
                  .join(' + ');
                return (
                  <button
                    key={area.id}
                    className={`gym-btn ${area.type} ${isActive ? 'active' : ''} ${
                      linked && isUnlocked ? 'route-ready' : isHomeNode ? '' : 'route-locked'
                    }`}
                    onClick={() => switchArea(area.id)}
                    disabled={(!linked && !isActive) || (!isUnlocked && !isActive)}
                    onMouseEnter={() => setPreviewZoneId(area.id)}
                    onMouseLeave={() => setPreviewZoneId((current) => (current === area.id ? null : current))}
                    onFocus={() => setPreviewZoneId(area.id)}
                    onBlur={() => setPreviewZoneId((current) => (current === area.id ? null : current))}
                    aria-label={`Travel to ${area.name}`}
                    title={
                      isActive
                        ? 'Current location'
                        : !isUnlocked
                          ? 'Locked: visit nearby gyms to unlock'
                          : linked
                            ? `Travel to ${area.name}`
                            : 'Explore map route to unlock this route'
                    }
                  >
                    <strong>{area.name}</strong>
                    <span>{area.type.toUpperCase()} · {ZONE_VIBES[area.id]?.accent ?? area.type}</span>
                    <small>Route: {routeDetail}</small>
                    <small>Machines: {topMachines || 'Mixed lifts'} · Boss {getGymBossTicker(area)}</small>
                  </button>
                );
              })}
              {previewZoneId && (() => {
                const preview = getRouteTransitionPreview(previewZoneId);
                if (!preview) return null;
                return (
                  <div className="route-preview-card" key={`preview-${preview.zone.id}`}>
                    <div className="route-preview-title">
                      {zoneNames[preview.zone.id] ?? preview.zone.id}
                    </div>
                    <small className="small-note">
                      {preview.canTravelNow
                        ? preview.isDirect
                          ? 'Direct travel route active'
                          : `Unlocked ${preview.routeDistance}-hop route`
                        : 'Route not unlocked yet'}
                    </small>
                    <small className="small-note">Route: {preview.routeName}</small>
                    <small className="small-note">Path: {preview.routePathName}</small>
                    <small className="small-note">Fatigue cost: {preview.fatigueCost.toFixed(1)}</small>
                    <small className="small-note">Scouting chance: {Math.round(preview.encounterChance * 100)}%</small>
                    <small className="small-note">Boss timer: {preview.bossTicker}</small>
                    {!preview.isUnlocked ? <small className="small-note route-preview-lock">Locked zone</small> : null}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="panel-head-row">
            <h3>Trainer Profile</h3>
            <div className="action-row">
              {activeZone.id === 'home' ? (
                <button
                  className="primary-btn micro-btn"
                  data-testid="open-physique-review"
                  onClick={openPhysiqueReview}
                  type="button"
                >
                  Physique Review
                </button>
              ) : null}
              <button
                className="secondary-btn micro-btn"
                onClick={reopenTrainerSetup}
                type="button"
              >
                Edit Trainer
              </button>
            </div>
          </div>
          <p className="small-note">
            {trainer.name} · Physique Level {String(trainerPhysique).padStart(2, '0')} ·
            editing the trainer profile preserves all journey progress.
          </p>

          <h3>Machines</h3>
          <p className="small-note">Selected machine boosts efficiency and fatigue tradeoff.</p>
          <div className="machine-grid">
            {activeZone.machines.map((machine) => (
              <button
                key={machine.id}
                className={`machine-btn ${activeMachine?.id === machine.id ? 'active' : ''}`}
                onClick={() => selectMachine(machine.id)}
              >
                  <strong>{machine.name}</strong>
                  <small>{machine.detail}</small>
                  <small>
                    XP {machine.rewardTable.buddyXp.min}-{machine.rewardTable.buddyXp.max} | x
                    {machine.rewardTable.buddyXp.multiplier.toFixed(2)}
                    {' · '}
                    HP {machine.hpEffect >= 0 ? '+' : ''}{machine.hpEffect}
                    {' · '}
                    Fatigue +{machine.fatigueCost}
                    {' · '}
                    Momentum {machine.momentumEffect >= 0 ? '+' : ''}{machine.momentumEffect}
                  </small>
                  <small>
                    Focus: {machine.focus} · {machine.buddyDisciplines.join(' / ')}
                    {' · '}
                    Difficulty {machine.difficulty}/5 · Trainer Lv {machine.recommendedTrainerLevel.min}-
                    {machine.recommendedTrainerLevel.max}
                    {' · '}
                    Drops: Boost {Math.round(machine.dropProbabilities.boostToken * 100)}% / Deload {Math.round(machine.dropProbabilities.deloadToken * 100)}%
                    {activeBuddy
                      ? ` · Readiness ${percent(
                          calculateWorkoutReadiness({
                            machine,
                            buddy: activeBuddy,
                            trainer,
                            gymKind: activeZone.type,
                            trainingFatigue: save.trainingFatigue,
                            workoutMomentum: save.workoutMomentum,
                          }),
                        )}`
                      : ''}
                  </small>
                </button>
              ))}
            </div>

          <div className="team-area">
            <h3>Team Slots (up to 6)</h3>
            <div className="team-slots">
              {Array.from({ length: TEAM_SIZE }).map((_, i) => {
                const buddy = save.team[i];
                const active = save.activeIndex === i;
                return (
                  <button
                    key={`slot-${i}`}
                    className={`team-slot ${active ? 'active' : ''}`}
                    disabled={!buddy}
                    onClick={() => selectBuddy(i)}
                  >
                    <strong>{`#${String(i + 1).padStart(2, '0')}`}</strong>
                    {buddy ? (
                      <>
                        <span>{buddy.nickname}</span>
                        <small>{buddy.creature.name}</small>
                        <em>
                          Lv {buddy.level} | HP {buddy.hp}/{buddy.maxHp} ({hpPercent(buddy.hp, buddy.maxHp)}%)
                        </em>
                      </>
                    ) : (
                      <span className="empty">EMPTY</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {activeBuddy ? (
            <>
              <h3>Active Buddy</h3>
              <div className="active-card">
                <div
                  className={
                     `workout-rig ${
                      workoutSession?.phase === 'rep'
                        ? 'workout-rig-running'
                        : workoutSession?.phase === 'spot'
                          ? 'workout-rig-spot'
                          : workoutSession?.phase === 'resolved'
                            ? 'workout-rig-resolved'
                            : ''
                    } ${
                      presentationEffect?.kind === 'level-up'
                        ? 'workout-rig-level-up'
                        : presentationEffect?.kind === 'rep-failure'
                          ? 'workout-rig-recoil'
                          : presentationEffect?.kind === 'rep-success'
                            ? 'workout-rig-cheer'
                            : ''
                    }`
                  }
                >
                  <PixelCreature
                    cosmetics={activeBuddy.cosmetics}
                    creature={activeBuddy.creature}
                    presentationContext="menu"
                    pose={workoutSession ? 'training' : 'idle'}
                    reducedMotion={save.accessibility.reducedMotion}
                    scale={2.4}
                  />
                </div>
                <div className="active-copy">
                  <strong>{activeBuddy.nickname}</strong>
                  <p>{activeBuddy.creature.flavor}</p>
                  <div>Lv {activeBuddy.level}</div>
                  <div>
                    HP {activeBuddy.hp}/{activeBuddy.maxHp}
                  </div>
                  <div className="buddy-metric-grid">
                    <div>Form: {activeBuddy.form} / {MAX_BUDDY_FORM}</div>
                    <div>Mobility: {activeBuddy.mobility} / {MAX_BUDDY_MOBILITY}</div>
                    <div>Volume: {activeBuddy.volume} / {MAX_BUDDY_VOLUME}</div>
                    <div>Band: {buddyStatBand(activeBuddy.form, MAX_BUDDY_FORM)}</div>
                  </div>
                  <div>
                    Momentum: {save.workoutMomentum}/{WORKOUT_MOMENTUM_MAX} · {workoutMomentumLabel(save.workoutMomentum)}
                  </div>
                  <div>
                    Deload Tokens: {save.deloadTokens}/{WORKOUT_DELOAD_MAX}
                  </div>
                  <div>Recovery: {activeBuddy.hp >= activeBuddy.maxHp ? 'ready' : `+${FATIGUE_BALANCE.restBuddyHeal} at next rest`}</div>
                  <div>Rest cooldown: {canRest ? 'Ready' : `${restCooldownSeconds}s`}</div>
                  <div>
                    Readiness state: {trainingFatigueLevel} ({percent(clamp01(1 - save.trainingFatigue / MAX_TRAINING_FATIGUE))})
                  </div>
                  <div>XP {activeBuddy.xp}/{getExperienceNeeded(activeBuddy.level)}</div>
                </div>
              </div>
              {buddyCustomizationOpen ? (
                <BuddyCustomizer
                  buddy={activeBuddy}
                  onChange={(updatedBuddy) =>
                    setSave((state) => ({
                      ...state,
                      team: state.team.map((entry) =>
                        entry.id === updatedBuddy.id ? updatedBuddy : entry,
                      ),
                    }))
                  }
                  onClose={() => setBuddyCustomizationOpen(false)}
                  reducedMotion={save.accessibility.reducedMotion}
                />
              ) : null}
              {workoutPreview && (
                <WorkoutMiniGame
                  canStart={
                    Boolean(activeBuddy && activeMachine) &&
                    !encounter &&
                    !match &&
                    !workoutSession &&
                    activeBuddy.hp > Math.max(1, -workoutPreview.expectedHpChange)
                  }
                  frame={workoutFrame}
                  keyboardBindings={save.input.keyboardBindings}
                  machineName={activeMachine?.name ?? 'Training station'}
                  paused={gameplayPaused}
                  preview={workoutPreview}
                  primaryMuscleGroups={activeMachine?.primaryMuscleGroups ?? []}
                  reducedMotion={save.accessibility.reducedMotion}
                  selectedLoad={selectedWorkoutLoad}
                  session={workoutSession}
                  trainerAppearance={trainerVisualPresentation.appearance}
                  onAction={performWorkoutAction}
                  onSelectLoad={setSelectedWorkoutLoad}
                  onStart={sendToWorkout}
                />
              )}
              <div className="action-row">
                <button
                  className="secondary-btn"
                  onClick={() =>
                    setBuddyCustomizationOpen((open) => !open)
                  }
                  type="button"
                >
                  {buddyCustomizationOpen
                    ? 'Close Buddy Style'
                    : 'Customize Buddy'}
                </button>
                <button className="secondary-btn" onClick={recoverWithRest} disabled={!canRest}>
                  Recover
                </button>
                <button
                  className="primary-btn"
                  onClick={useSteroid}
                  disabled={!activeBuddy || save.steroids <= 0}
                >
                  Use Steroid (x{save.steroids})
                </button>
              </div>
            </>
          ) : (
            <p className="small-note">No active buddy selected.</p>
          )}

          <div className="xp-track">
            <div className="xp-fill" style={{ width: `${(save.team.length / TEAM_SIZE) * 100}%` }} />
          </div>

          <button className="primary-btn" onClick={beginEncounter} disabled={activeZone.type === 'home'}>
            Scout Wild Buddy
          </button>
        </section>

        <section className="panel">
          <h2>Capture Arena</h2>
          {!encounter ? (
            <p className="small-note">
              No encounter active. Scout a route or answer a ready boss
              challenge from the current gym.
            </p>
          ) : (
            <>
              <div
                className={`combat-stage combat-speed-${captureSpeed.id} ${
                  captureAnimation
                    ? `combat-beat-${captureAnimation.tone} combat-move-${captureAnimation.moveId}`
                    : ''
                } ${
                  encounter.isBoss
                    ? `combat-stage-boss ${
                        isMatchChallengeForcedRecovery
                          ? 'combat-stage-overload'
                          : isMatchChallengeAligned === false
                            ? 'combat-stage-drift'
                            : isMatchChallengeInDanger
                              ? 'combat-stage-danger'
                              : isMatchChallengeStreakReady || (match && match.meter >= activeMatchCaptureTarget - 6)
                                ? 'combat-stage-ready'
                              : isMatchChallengeAligned
                                ? 'combat-stage-lock'
                                : ''
                      } ${isMatchChallengeInDanger ? 'combat-stage-danger' : ''} ${
                        encounterBoss
                          ? `boss-arena-${encounterBoss.arenaEffect.className}`
                          : ''
                      }`
                    : ''
                }`}
              >
                {bossEntrance ? (
                  <div
                    className="boss-entrance"
                    role="status"
                    style={{
                      '--boss-entrance-ms': `${bossEntranceDuration}ms`,
                    } as Record<string, string>}
                  >
                    <span className="boss-entrance-kicker">Challenge line opens</span>
                    <strong>{bossEntrance.bossName}</strong>
                    <small>{bossEntrance.gymName} · {bossEntrance.signature}</small>
                    <button type="button" onClick={skipPresentationSequence}>
                      Skip entrance
                    </button>
                  </div>
                ) : null}
                <div className="combat-row">
                  <div
                    className={`combat-figure ${encounter.isBoss ? 'combat-figure-fighter' : ''} ${capturePlayerReactionClass}`}
                  >
                    {activeBuddy ? (
                      <PixelCreature
                        animated
                        battlePose={capturePlayerBattlePose}
                        cosmetics={activeBuddy.cosmetics}
                        creature={activeBuddy.creature}
                        pose={
                          match?.status === 'captured'
                            ? 'victory'
                            : captureAnimation
                              ? 'capture'
                              : 'idle'
                        }
                        presentationContext="battle"
                        reducedMotion={save.accessibility.reducedMotion}
                      />
                    ) : <span>None</span>}
                    <span>You</span>
                  </div>
                  <div className="combat-vs">VS</div>
                  <div
                    className={`combat-figure ${encounter.isBoss ? 'combat-figure-opponent' : ''} ${encounterBossPresentation?.arenaLightingClass ?? ''} ${captureOpponentReactionClass}`}
                  >
                    <PixelCreature
                      animationCueId={
                        encounter.isBoss &&
                        (match?.status === 'escape' ||
                          match?.status === 'failed-pin' ||
                          match?.status === 'near-capture')
                          ? encounterBossCharacterDesign?.victoryAnimationId
                          : encounterBossCharacterDesign?.entranceAnimationId
                      }
                      animated
                      battlePose={captureOpponentBattlePose}
                      bossId={encounterBoss?.id}
                      bossTier={encounterBossPresentation?.tier}
                      cosmetics={encounterBossCosmetics}
                      creature={encounter.creature}
                      pose={
                        encounter.isBoss && encounterBossPresentation
                          ? encounterBossPresentation.poseId
                          : encounter.isBoss &&
                        (match?.status === 'escape' ||
                          match?.status === 'failed-pin' ||
                          match?.status === 'near-capture')
                          ? 'victory'
                          : match?.status === 'captured' ||
                              match?.status === 'full-party'
                            ? 'capture'
                            : encounter.isBoss
                              ? 'entrance'
                              : 'idle'
                      }
                      presentationContext="battle"
                      reducedMotion={save.accessibility.reducedMotion}
                    />
                    <span>{encounter.creature.name}</span>
                  </div>
                </div>
                {captureAnimation ? (
                  <button
                    type="button"
                    className="combat-skip-effect"
                    onClick={skipPresentationSequence}
                  >
                    Skip impact
                  </button>
                ) : null}

                <div className="encounter-data">
                  <div>Location: {zoneNames[encounter.zoneId]}</div>
                  <div>
                    Lv {encounter.level} · {encounter.isBoss ? 'Boss' : 'Wild'}{' '}
                    {encounter.bossName ? `(${encounter.bossName})` : ''} · Capture outlook{' '}
                    {encounter.catchChance >= 0.84
                      ? 'open'
                      : encounter.catchChance >= 0.7
                        ? 'contested'
                        : 'guarded'}
                    {encounter.creature.isExotic ? ' (Exotic)' : ''}
                  </div>
                  <small>
                    Discipline: {encounter.creature.primaryDiscipline}
                    {encounter.creature.secondaryDiscipline
                      ? ` / ${encounter.creature.secondaryDiscipline}`
                      : ''}
                    {' · '}Zone pressure: {encounterZone.type}
                  </small>
                  {encounterBoss ? (
                    <div className="boss-dossier">
                      <strong>
                        {encounterBoss.name} · {encounterBoss.arenaEffect.name}
                      </strong>
                      <span>{encounterBoss.visualIdentity}</span>
                      <small>{encounterBoss.personality}</small>
                      <small>
                        Preferred tactic: {MOVES.find((move) => move.id === encounterBoss.preferredTactic)?.title}
                        {' · '}Counterplay: {encounterBoss.counterplay}
                      </small>
                      <small>
                        Signature: {encounterBoss.signatureRule.name} ·{' '}
                        {encounterBoss.signatureRule.warning}
                      </small>
                      {encounterBossCharacterDesign ? (
                        <>
                          <small>
                            Build: {encounterBossCharacterDesign.buildLabel} ·{' '}
                            {encounterBossCharacterDesign.battleStance}
                          </small>
                          <small>
                            Philosophy: {encounterBossCharacterDesign.trainingPhilosophy}
                          </small>
                          <small>
                            Signature gear: {encounterBossCharacterDesign.signatureClothing} ·{' '}
                            {encounterBossCharacterDesign.signatureEquipment}
                          </small>
                        </>
                      ) : null}
                      <small>
                        Victory rewards: {encounterBoss.rewardTable.buddyXp} XP ·{' '}
                        {encounterBoss.rewardTable.fatigueRecovery} recovery ·{' '}
                        {encounterBoss.rewardTable.momentum} momentum ·{' '}
                        {encounterBoss.rewardTable.deloadTokens} guaranteed Deload
                      </small>
                    </div>
                  ) : null}
                  {encounter.isBoss && encounterChallengeMachine ? (
                    <small>
                      Machine challenge: {encounterChallengeMachine.name} · Challenge bonus {encounterMachineBonus >= 0 ? '+' : ''}
                      {encounterMachineBonus}
                    </small>
                  ) : null}
                  {match?.encounter?.isBoss ? <small>Boss capture target: {activeMatchCaptureTarget}%</small> : null}
                  {match?.encounter?.isBoss && match.isBossChallengeActive ? (
                    <small>
                      Challenge stress: {activeMatchChallengeStress.label} · {activeMatchChallengeStress.percent}% ·{' '}
                      {activeMatchChallengeStress.detail}
                    </small>
                  ) : null}
                  {activeMatchChallengeSummary?.isActive ? (
                    <small>
                      Challenge tier: {bossChallengeThresholdText(activeMatchChallengeSummary.tier, encounterZone.type)}
                    </small>
                  ) : null}
                  {challengeAlignmentText ? <small>{challengeAlignmentText}</small> : null}
                  {activeBuddy ? (
                    <small>
                      Trainer power {encounterTrainerPressure} · Buddy power {encounterBuddyPressure}
                    </small>
                  ) : null}
                  {match?.status === 'playing' ? (
                    <div className="opponent-tell" role="status" aria-live="polite">
                      <strong>Opponent tell · {match.opponentIntent.tendencyLabel}</strong>
                      <span>{match.opponentIntent.tell}</span>
                      <small>
                        Read: {match.opponentIntent.confidence === 'clear' ? 'clear' : 'mixed'}.
                        Predictions show matchup direction, never the hidden roll.
                      </small>
                    </div>
                  ) : null}
                  {match?.isBossChallengeActive && match.encounter?.isBoss ? (
                    <small>
                      Challenge misses: {match.bossChallengeMisses} · Near misses: {match.bossChallengeNearMisses} ·
                      Required action: {match.bossChallengeMachineName ?? 'locked'} +{' '}
                      {match.encounter.bossRequiredMoveName ?? 'announced move'}
                    </small>
                  ) : null}
                  {isMatchChallengeOverload ? (
                    <small>
                      Boss challenge overload: complete the required
                      machine-and-move action immediately.
                    </small>
                  ) : null}
                  {isMatchChallengeForcedRecovery ? (
                    <small className="overload-action-callout">
                      Forced recovery lock: every non-required move increases pressure and fatigue.
                    </small>
                  ) : null}
                  {match?.isBossChallengeActive && activeMatchChallengeSummary?.isActive ? (
                    <small>
                      Streak {match?.bossChallengeMatchStreak ?? 0}/{activeMatchChallengeProfile.streakLimit} ·
                      Grace {activeMatchChallengeProfile.missResetGrace}
                    </small>
                  ) : null}
                  {match?.encounter?.isBoss && match.isBossChallengeActive ? (
                    <div
                      className="challenge-stress-track"
                      role="meter"
                      aria-label={`Boss challenge stress: ${activeMatchChallengeStress.percent} percent, ${activeMatchChallengeStress.label}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={activeMatchChallengeStress.percent}
                    >
                      <div
                        className={`challenge-stress-fill challenge-stress-${activeMatchChallengeStress.tone}`}
                        style={{ width: `${activeMatchChallengeStress.percent}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {!match ? (
                <button className="primary-btn" onClick={startMatch}>
                  Take the Rally Grip
                </button>
              ) : (
                <>
                  <div className="capture-stamina-grid" aria-label="Capture stamina">
                    <div>
                      <span>Team stamina {match.playerStamina}</span>
                      <div className="capture-stamina-track">
                        <div
                          className="capture-stamina-fill capture-stamina-player"
                          style={{ width: `${match.playerStamina}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <span>Wild stamina {match.opponentStamina}</span>
                      <div className="capture-stamina-track">
                        <div
                          className="capture-stamina-fill capture-stamina-wild"
                          style={{ width: `${match.opponentStamina}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    className="meter-track"
                    role="meter"
                    aria-label={`Control meter. ${match.meter} percent. Secure control begins at ${activeMatchCaptureTarget} percent.`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={match.meter}
                  >
                    <div
                      className={`meter-fill ${
                        match.encounter.isBoss
                          ? isMatchChallengeOverload
                            ? 'meter-fill-challenge-overload'
                            : isMatchChallengeAligned === false
                            ? 'meter-fill-challenge-miss'
                            : isMatchChallengeInDanger
                              ? 'meter-fill-challenge-danger'
                              : isMatchChallengeStreakReady
                                ? 'meter-fill-challenge-lock'
                                : match.meter >= activeMatchCaptureTarget - 8
                                  ? 'meter-fill-challenge-ready'
                                  : isMatchChallengeAligned
                                    ? 'meter-fill-challenge-lock'
                                    : ''
                          : ''
                      }`}
                      style={{ width: `${match.meter}%` }}
                    />
                    <div
                      className="meter-capture-zone"
                      style={{
                        left: `${activeMatchCaptureTarget}%`,
                        width: `${100 - activeMatchCaptureTarget}%`,
                      }}
                    />
                    <div
                      className="meter-capture-threshold"
                      style={{ left: `${activeMatchCaptureTarget}%` }}
                    />
                    <div className="meter-center" />
                    <div className="meter-pin" />
                  </div>
                  <div className="capture-round-row">
                    <span>Round {match.round}/{match.maxRounds}</span>
                    <span>
                      Control {match.meter}% · secure at {activeMatchCaptureTarget}%
                    </span>
                  </div>

                  {match.status === 'playing' && (
                    <div className="capture-move-grid">
                      {MOVES.map((move, index) => {
                        const prediction = captureMovePredictions.get(move.id);
                        return (
                          <button
                            key={move.id}
                            className={`capture-move-btn capture-forecast-${prediction?.advantage ?? 'even'} ${
                              isMatchChallengeForcedRecovery
                                ? 'combat-move-recovery'
                                : ''
                            }`}
                            onClick={() => performMove(move)}
                            disabled={
                              Boolean(captureAnimation) ||
                              Boolean(
                                isMatchChallengeOverload &&
                                  !isMatchChallengeAligned,
                              )
                            }
                            aria-keyshortcuts={`${index + 1}`}
                          >
                            <span className="capture-move-heading">
                              <strong>{index + 1}. {move.title}</strong>
                              <span>{prediction?.advantage ?? 'even'}</span>
                            </span>
                            <small>{move.summary}</small>
                            <span className="capture-move-economy">
                              Cost {move.staminaCost} · after {prediction?.staminaAfter ?? match.playerStamina}
                            </span>
                            <span className="capture-move-reason">
                              {prediction?.reasons.join(' · ') ?? move.tactic}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="narration">
                    {match.lines.map((line, index) => (
                      <p key={`${match.round}-${index}`}>{line}</p>
                    ))}
                  </div>

                  {match.status !== 'playing' && (
                    <div
                      className={`result-block capture-result capture-result-${match.status}`}
                      role="status"
                    >
                      {['near-capture', 'captured', 'full-party', 'pin-win'].includes(
                        match.status,
                      ) ? (
                        <span className="capture-result-kicker">Pin win</span>
                      ) : null}
                      <h3>
                        {match.status === 'captured'
                          ? 'Successful capture'
                          : match.status === 'full-party'
                            ? 'Full-party capture'
                            : match.status === 'near-capture'
                              ? 'Near-capture'
                              : match.status === 'failed-pin'
                                ? 'Failed pin'
                                : match.status === 'escape'
                                  ? 'Opponent escaped'
                                  : 'Pin won'}
                      </h3>
                      <p>
                        {match.status === 'captured'
                          ? 'The challenge bond is complete.'
                          : match.status === 'full-party'
                            ? match.pendingCapturedBuddy
                              ? 'Choose a party slot to rotate, or let the captured Buddy return safely.'
                              : 'The capture was recorded and the party remains unchanged.'
                            : match.status === 'near-capture'
                              ? 'You secured the pin, but the final invitation did not hold.'
                              : match.status === 'failed-pin'
                                ? `Control did not reach the ${activeMatchCaptureTarget}% secure line.`
                                : match.status === 'escape'
                                  ? 'Control fell far enough for the wild Buddy to break away.'
                                  : 'The control count is complete.'}
                      </p>
                      {match.status === 'full-party' &&
                      match.pendingCapturedBuddy ? (
                        <div
                          className="capture-party-choice"
                          aria-label="Choose a Buddy to rotate out"
                        >
                          <strong>
                            Place {match.pendingCapturedBuddy.nickname}
                          </strong>
                          <div className="capture-party-grid">
                            {save.team.map((buddy, index) => (
                              <button
                                key={buddy.id}
                                type="button"
                                className="capture-party-slot"
                                onClick={() =>
                                  replacePartySlotAfterCapture(index)
                                }
                              >
                                <span>Replace slot {index + 1}</span>
                                <strong>{buddy.nickname}</strong>
                                <small>
                                  {buddy.creature.name} · Lv {buddy.level}
                                  {save.activeIndex === index
                                    ? ' · Active'
                                    : ''}
                                </small>
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="secondary-btn"
                            onClick={releaseFullPartyCapture}
                          >
                            Let captured Buddy return to the route
                          </button>
                        </div>
                      ) : (
                        <button
                          className="secondary-btn"
                          onClick={() => {
                            setMatch(null);
                            setEncounter(null);
                            setMessage('Arena reset. Scout again when ready.');
                          }}
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        <section className="panel">
          <BuddyIndex
            species={CREATURES}
            seenDex={save.seenDex}
            caughtDex={save.caughtDex}
          />

          <h3>Log</h3>
          <ul className="log-list">
            {log.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="status-bar">
        <strong>Broadcast:</strong> {message}
      </footer>
      {physiqueReviewOpen ? (
        <PhysiqueReviewPanel
          buddy={activeBuddy ?? undefined}
          challengeResult={bodybuildingChallengeResult}
          fatigue={save.trainingFatigue}
          onChallenge={runBodybuildingChallenge}
          onClose={closePhysiqueReview}
          onDebugAdjust={adjustVisualProgressionDebug}
          onPreferencesChange={setVisualProgressionPreferences}
          onSaveSnapshot={savePhysiqueSnapshot}
          presentation={trainerVisualPresentation}
          ratings={physiqueRatings}
          reducedMotion={save.accessibility.reducedMotion}
          trainer={save.trainer}
          visualProgression={save.visualProgression}
        />
      ) : null}
      <JourneyRestartDialog
        onCancel={() => setRestartConfirmationOpen(false)}
        onConfirm={restartOpeningProcess}
        open={restartConfirmationOpen}
      />
    </div>
  );
}

