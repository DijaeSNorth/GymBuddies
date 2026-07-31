import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react';

import { createRetroAudioEngine } from './game/audio/retroAudioEngine';
import {
  AUTOSAVE_MIN_INTERVAL_MS,
  getAutosaveDelayMs,
  hasOnlyAllowedTopLevelChanges,
} from './game/save/autosavePolicy';
import { createDefaultSaveData } from './game/save/saveDefaults';
import { CURRENT_SAVE_SCHEMA_VERSION } from './game/content/save';
import {
  getBrowserSaveStorage,
  hasPreviousSave,
  importSaveJson,
  loadGameSave,
  loadPreviousSave,
  writeGameSave,
  type SaveLoadResult,
} from './game/save/saveService';
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
import { createDefaultVisualProgressionState } from './game/systems/visualProgression';
import { calculateTrainerPhysiqueLevel } from './game/systems/trainerProgression';
import {
  normalizeUnlockedZones,
} from './game/systems/unlockProgression';
import {
  DEFAULT_TRAINER_BODY_PRESET_ID,
  getTrainerBodyPresetById,
} from './game/content/trainer';
import { getTrainerPhysiquePresetById } from './game/content/trainerAppearance';
import { FALLBACK_UNLOCKED_ZONES } from './game/content/routes';
import {
  GYMS,
  STARTING_ZONE_ID,
} from './game/content/gyms';
import { TUTORIAL_STEPS } from './game/content/tutorial';
import type {
  AudioEngine,
  SaveData,
  TrainerAppearance,
  TrainerAppearancePreset,
  TrainerCreationDraft,
  TrainerMuscleId,
  TrainerStartMode,
} from './game/types';
import { AppErrorBoundary } from './ui/errors/AppErrorBoundary';
import type {
  JourneyAudioServices,
  JourneySaveServices,
} from './ui/journey/journeyTypes';
import { downloadSaveJson } from './ui/save/saveDownload';
import { AlphaPlaytestEntry } from './ui/playtest/AlphaPlaytestEntry';
import {
  useAlphaPlaytest,
  type AlphaPlaytestController,
} from './ui/playtest/useAlphaPlaytest';
import type { SaveUiActionResult } from './ui/save/SaveManagementPanel';
import {
  JourneyRestartDialog,
  TrainerCreationScreen,
} from './ui/trainer/TrainerCreationScreen';

const LazyJourneyGame = lazy(() =>
  import('./ui/journey/JourneyGame').then(({ JourneyGame }) => ({
    default: JourneyGame,
  })),
);

type InitialApplicationState = Readonly<{
  load: SaveLoadResult;
  showTrainerSetup: boolean;
  setupMode: 'new' | 'edit';
}>;

function shouldForceTrainerSetup() {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).get('setup') === '1') {
    return true;
  }
  const storage = getBrowserSaveStorage();
  if (!storage) return false;
  try {
    const forceSetup =
      storage.getItem('gymbuddies-force-setup') === '1';
    if (forceSetup) {
      storage.removeItem('gymbuddies-force-setup');
    }
    return forceSetup;
  } catch {
    return false;
  }
}

function createInitialApplicationState(): InitialApplicationState {
  const load = loadGameSave(getBrowserSaveStorage());
  const forcedSetup = shouldForceTrainerSetup();
  return {
    load,
    showTrainerSetup: !load.save.hasStarterSet || forcedSetup,
    setupMode:
      load.save.hasStarterSet && forcedSetup ? 'edit' : 'new',
  };
}

function nowMs() {
  return Date.now();
}

function OpeningFailure() {
  return (
    <main className="application-error-shell" role="alert">
      <p className="trainer-kicker">Gym Buddies recovery</p>
      <h1>The opening interface could not start.</h1>
      <p>
        Your browser save has not been changed. Reload the application to
        retry the interface.
      </p>
      <button
        className="primary-btn"
        onClick={() => window.location.reload()}
        type="button"
      >
        Reload application
      </button>
    </main>
  );
}

type ApplicationCoordinatorProps = Readonly<{
  playtest: AlphaPlaytestController;
}>;

function fatigueRange(value: number) {
  if (value < 25) return 'rested' as const;
  if (value < 55) return 'building' as const;
  if (value < 80) return 'high' as const;
  return 'peak' as const;
}

function ApplicationCoordinator({
  playtest,
}: ApplicationCoordinatorProps) {
  const initialStateRef = useRef<InitialApplicationState | null>(null);
  if (!initialStateRef.current) {
    initialStateRef.current = createInitialApplicationState();
  }
  const initialState = initialStateRef.current;
  const saveStorageRef = useRef(getBrowserSaveStorage());
  const skipNextAutosaveRef = useRef(
    initialState.load.source === 'primary',
  );
  const [save, setSave] = useState(initialState.load.save);
  const latestSaveRef = useRef(save);
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveDirtyRef = useRef(false);
  const lastAutosaveAtRef = useRef(0);
  const lastPersistedSaveRef = useRef(save);
  const [savePersistenceEnabled, setSavePersistenceEnabled] = useState(
    initialState.load.canAutosave,
  );
  const [saveLoadMessage, setSaveLoadMessage] = useState(
    initialState.load.message,
  );
  const [saveLoadIssues, setSaveLoadIssues] = useState<string[]>(
    initialState.load.issues,
  );
  const [previousSaveAvailable, setPreviousSaveAvailable] = useState(
    () => hasPreviousSave(saveStorageRef.current),
  );
  const savePersistenceEnabledRef = useRef(savePersistenceEnabled);
  const persistLatestSaveRef = useRef<() => void>(() => undefined);
  const [showTrainerSetup, setShowTrainerSetup] = useState(
    initialState.showTrainerSetup,
  );
  const [trainerSetupMode, setTrainerSetupMode] = useState<'new' | 'edit'>(
    initialState.setupMode,
  );
  const [draftTrainer, setDraftTrainer] =
    useState<TrainerCreationDraft>(() => {
      const draft = createTrainerCreationDraft(save.trainer);
      return initialState.setupMode === 'new'
        ? applyTrainerBodyPreset(
            draft,
            getTrainerBodyPresetById(
              DEFAULT_TRAINER_BODY_PRESET_ID,
            ),
          )
        : draft;
    });
  const [trainerStartMode, setTrainerStartMode] =
    useState<TrainerStartMode>('guided');
  const [restartConfirmationOpen, setRestartConfirmationOpen] =
    useState(false);
  const [journeyStarted, setJourneyStarted] = useState(
    save.hasStarterSet && !initialState.showTrainerSetup,
  );
  const [journeyRevision, setJourneyRevision] = useState(0);
  const [journeyMessage, setJourneyMessage] = useState(
    initialState.load.message ||
      'Welcome to Gym Buddies. Start from Home Gym and build your team.',
  );
  const audioRef = useRef<AudioEngine | null>(null);
  const playtestLoadRecordedRef = useRef(false);

  latestSaveRef.current = save;
  savePersistenceEnabledRef.current = savePersistenceEnabled;

  useEffect(() => {
    const activeBuddy = save.team[save.activeIndex] ?? null;
    playtest.setContext({
      mode: showTrainerSetup
        ? 'trainer-creation'
        : journeyStarted
          ? 'journey'
          : 'opening',
      gymId: journeyStarted ? save.activeZoneId : null,
      routeId: null,
      trainerLevel: calculateTrainerPhysiqueLevel(
        save.trainer.muscles,
      ),
      activeBuddyLevel: activeBuddy?.level ?? null,
      partySize: save.team.length,
      fatigueRange: fatigueRange(save.trainingFatigue),
      tutorialStep: save.tutorialStep,
      completedBosses: Object.values(save.bossSchedules).filter(
        (schedule) => schedule.defeated > 0,
      ).length,
      overlay: showTrainerSetup ? 'trainer-forge' : 'none',
    });
  }, [
    journeyStarted,
    playtest,
    save.activeIndex,
    save.activeZoneId,
    save.bossSchedules,
    save.team,
    save.trainer.muscles,
    save.trainingFatigue,
    save.tutorialStep,
    showTrainerSetup,
  ]);

  useEffect(() => {
    if (!playtest.enabled || playtestLoadRecordedRef.current) return;
    playtestLoadRecordedRef.current = true;
    playtest.recordEvent('save-loaded', 'Validated game save loaded');
    if (/migrat/i.test(initialState.load.message)) {
      playtest.recordEvent(
        'save-migrated',
        'Save migration completed',
      );
    }
    if (initialState.load.recovered) {
      playtest.increment('unexpectedReloadRecoveries');
    }
  }, [initialState.load, playtest]);

  function getAudioEngine() {
    if (audioRef.current) return audioRef.current;
    const engine = createRetroAudioEngine();
    engine.setPageHidden(
      typeof document !== 'undefined' &&
        document.visibilityState !== 'visible',
    );
    audioRef.current = engine;
    return engine;
  }

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
      document.removeEventListener(
        'visibilitychange',
        flushWhenHidden,
      );
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, []);

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
    setDraftTrainer((state) =>
      updateTrainerDraftMuscle(state, group, value),
    );
  }

  function setDraftTrainerPreset(presetId: string) {
    setDraftTrainer((state) =>
      applyTrainerBodyPreset(
        state,
        getTrainerBodyPresetById(presetId),
      ),
    );
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

  function playLaunchCue() {
    const engine = getAudioEngine();
    engine.setEnabled(save.audio.enabled);
    engine.setVolumes(
      save.audio.musicVolume,
      save.audio.sfxVolume,
    );
    void engine.unlock().then((ready) => {
      if (ready) engine.emitSfx('menu-navigate', 0.9);
    });
  }

  function launchTrainer() {
    const trainerProfile =
      trainerProfileFromCreationDraft(draftTrainer);
    if (trainerSetupMode === 'edit') {
      setSave((state) =>
        saveTrainerProfileToJourney(state, draftTrainer),
      );
      setDraftTrainer(
        createTrainerCreationDraft(trainerProfile),
      );
      setShowTrainerSetup(false);
      setJourneyStarted(true);
      setJourneyMessage(
        `Trainer profile saved for ${trainerProfile.name}. Journey progress was preserved.`,
      );
      return;
    }
    const startWithTutorial = trainerStartMode === 'guided';
    setSave((state) => ({
      ...state,
      hasStarterSet: true,
      activeZoneId: STARTING_ZONE_ID,
      unlockedZoneIds: normalizeUnlockedZones({
        raw: FALLBACK_UNLOCKED_ZONES,
        fallback: FALLBACK_UNLOCKED_ZONES,
        validZoneIds: GYMS.map((gym) => gym.id),
        startingZoneId: STARTING_ZONE_ID,
      }),
      visitedZoneIds: ['home'],
      tutorialStep: startWithTutorial
        ? 0
        : TUTORIAL_STEPS.length,
      trainer: trainerProfile,
      visualProgression: createDefaultVisualProgressionState(
        trainerProfile.appearance,
      ),
    }));
    setJourneyMessage(
      startWithTutorial
        ? `Welcome, ${trainerProfile.name}. Your guided journey begins at Home Gym.`
        : `Welcome, ${trainerProfile.name}. Your normal journey begins at Home Gym.`,
    );
    setShowTrainerSetup(false);
    setJourneyStarted(true);
    playtest.markChecklist('new-journey', true);
    playtest.markChecklist('trainer', true);
    playtest.recordEvent(
      'location-entered',
      'Journey began at Home Gym',
    );
    playtest.queueCheckpoint('trainer-created');
    playLaunchCue();
    window.requestAnimationFrame(() => {
      document.getElementById('root')?.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }

  function editTrainer() {
    setTrainerSetupMode('edit');
    setDraftTrainer(createTrainerCreationDraft(save.trainer));
    setShowTrainerSetup(true);
    setRestartConfirmationOpen(false);
  }

  function cancelTrainerEdit() {
    setDraftTrainer(createTrainerCreationDraft(save.trainer));
    setShowTrainerSetup(false);
    setRestartConfirmationOpen(false);
    setJourneyStarted(save.hasStarterSet);
    setJourneyMessage(
      'Trainer changes canceled. Journey progress is unchanged.',
    );
  }

  function applyLoadedSave(
    next: SaveData,
    statusMessage: string,
    issues: readonly string[] = [],
  ) {
    skipNextAutosaveRef.current = true;
    setSave(next);
    setSavePersistenceEnabled(true);
    setSaveLoadMessage(statusMessage);
    setSaveLoadIssues([...issues]);
    setDraftTrainer(createTrainerCreationDraft(next.trainer));
    setTrainerSetupMode('new');
    setShowTrainerSetup(!next.hasStarterSet);
    setJourneyStarted(next.hasStarterSet);
    setJourneyMessage(statusMessage);
    setJourneyRevision((revision) => revision + 1);
    playtest.recordEvent('save-loaded', 'Validated save applied');
    if (/migrat/i.test(statusMessage)) {
      playtest.recordEvent(
        'save-migrated',
        'Save migration completed',
      );
    }
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
    const statusMessage =
      `Imported a validated schema-14 Gym Buddies save.${migrationText}`;
    applyLoadedSave(
      imported.save,
      statusMessage,
      imported.issues,
    );
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
    applyLoadedSave(
      previous.save,
      statusMessage,
      previous.issues,
    );
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
      setJourneyMessage(
        'Reset canceled because the new save could not be stored safely.',
      );
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
    setShowTrainerSetup(true);
    setJourneyStarted(false);
    setJourneyRevision((revision) => revision + 1);
    setJourneyMessage(
      'Journey restarted. Create a trainer to begin again from Home Gym.',
    );
  }

  const saveServices: JourneySaveServices = {
    persistenceEnabled: savePersistenceEnabled,
    loadMessage: saveLoadMessage,
    loadIssues: saveLoadIssues,
    previousSaveAvailable,
    importJourneyJson,
    restorePreviousJourney,
  };
  const audioServices: JourneyAudioServices = {
    engineRef: audioRef,
    getEngine: getAudioEngine,
  };
  const playtestServices = {
    enabled: playtest.enabled,
    recordEvent: playtest.recordEvent,
    increment: playtest.increment,
    queueCheckpoint: playtest.queueCheckpoint,
    markChecklist: playtest.markChecklist,
    recordError: playtest.recordError,
    setSafeForCheckpoint: playtest.setSafeForCheckpoint,
    updateContext: playtest.updateContext,
  };
  const journeyActive =
    journeyStarted && save.hasStarterSet && !showTrainerSetup;

  return (
    <>
      {journeyStarted && save.hasStarterSet ? (
        <AppErrorBoundary
          resetKey={journeyRevision}
          onError={() =>
            playtest.recordError(
              'journey-ui',
              'The journey interface stopped and entered recovery.',
            )
          }
          onRetry={() =>
            playtest.recordEvent(
              'journey-retried',
              'Journey interface retry requested',
            )
          }
          fallback={({ retry }) => (
            <main className="application-error-shell" role="alert">
              <p className="trainer-kicker">Journey interface recovery</p>
              <h1>The journey interface stopped safely.</h1>
              <p>
                Your versioned save is still available. Retry the interface,
                return to trainer setup, export the save, or reload.
              </p>
              <div className="action-row">
                <button
                  className="primary-btn"
                  onClick={retry}
                  type="button"
                >
                  Retry interface
                </button>
                <button
                  className="secondary-btn"
                  onClick={editTrainer}
                  type="button"
                >
                  Return to trainer setup
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => downloadSaveJson(save)}
                  type="button"
                >
                  Export save
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => window.location.reload()}
                  type="button"
                >
                  Reload application
                </button>
              </div>
            </main>
          )}
        >
          <Suspense
            fallback={
              journeyActive ? (
                <main
                  aria-live="polite"
                  className="journey-module-loading"
                  role="status"
                >
                  <p className="trainer-kicker">Field link</p>
                  <h1>Preparing your Gym Buddies journey…</h1>
                </main>
              ) : null
            }
          >
            <LazyJourneyGame
              key={journeyRevision}
              active={journeyActive}
              audioServices={audioServices}
              initialMessage={journeyMessage}
              onEditTrainer={editTrainer}
              onRestartJourney={() =>
                setRestartConfirmationOpen(true)
              }
              onReturnToOpening={editTrainer}
              onSaveChange={setSave}
              playtestServices={playtestServices}
              save={save}
              saveServices={saveServices}
            />
          </Suspense>
        </AppErrorBoundary>
      ) : null}
      {showTrainerSetup ? (
        <TrainerCreationScreen
          draft={draftTrainer}
          keyboardBindings={save.input.keyboardBindings}
          mode={trainerSetupMode}
          physiqueLevel={calculateTrainerPhysiqueLevel(
            draftTrainer.muscles,
          )}
          reducedMotion={save.accessibility.reducedMotion}
          restartConfirmationOpen={restartConfirmationOpen}
          startMode={trainerStartMode}
          validationIssues={validateTrainerCreationDraft(draftTrainer)}
          onAppearanceChange={setDraftTrainerAppearance}
          onAppearancePresetsChange={
            setDraftTrainerAppearancePresets
          }
          onCancelEdit={cancelTrainerEdit}
          onCancelRestart={() =>
            setRestartConfirmationOpen(false)
          }
          onConfirm={launchTrainer}
          onConfirmRestart={restartOpeningProcess}
          onMuscleChange={setDraftTrainerMuscle}
          onNameChange={setDraftTrainerName}
          onPhysiquePresetSelect={setDraftTrainerPhysiquePreset}
          onPresetSelect={setDraftTrainerPreset}
          onRequestRestart={() =>
            setRestartConfirmationOpen(true)
          }
          onStartModeChange={setTrainerStartMode}
        />
      ) : null}
      {!showTrainerSetup ? (
        <JourneyRestartDialog
          onCancel={() => setRestartConfirmationOpen(false)}
          onConfirm={restartOpeningProcess}
          open={restartConfirmationOpen}
        />
      ) : null}
    </>
  );
}

export default function App() {
  const playtest = useAlphaPlaytest();
  return (
    <>
      <AppErrorBoundary
        fallback={() => <OpeningFailure />}
        onError={() =>
          playtest.recordError(
            'application',
            'The opening interface stopped and entered recovery.',
          )
        }
      >
        <ApplicationCoordinator playtest={playtest} />
      </AppErrorBoundary>
      <AlphaPlaytestEntry
        controller={playtest}
        saveSchemaVersion={CURRENT_SAVE_SCHEMA_VERSION}
      />
    </>
  );
}
