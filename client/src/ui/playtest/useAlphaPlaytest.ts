import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  addCheckpointFeedback,
  addPlaytestError,
  addQuickPlaytestNote,
  advancePlaytestSession,
  appendPlaytestEvent,
  createPlaytestReport,
  createPlaytestSession,
  dismissPlaytestCheckpoint,
  incrementPlaytestCounter,
  loadPlaytestSession,
  queuePlaytestCheckpoint,
  removePlaytestFeedback,
  writePlaytestSession,
} from '../../game/playtest/playtestService';
import type {
  PlaytestCheckpointId,
  PlaytestChecklistId,
  PlaytestCohortId,
  PlaytestContext,
  PlaytestCounterKey,
  PlaytestErrorCategory,
  PlaytestNoteCategory,
  PlaytestRatings,
  PlaytestReportOptions,
  PlaytestSession,
  PlaytestTimelineEventKind,
} from '../../game/playtest/types';

const EMPTY_CONTEXT: PlaytestContext = {
  mode: 'opening',
  gymId: null,
  routeId: null,
  trainerLevel: 0,
  activeBuddyLevel: null,
  partySize: 0,
  fatigueRange: 'rested',
  tutorialStep: 0,
  completedBosses: 0,
  overlay: 'none',
};

function getStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export type AlphaPlaytestController = ReturnType<
  typeof useAlphaPlaytest
>;

export function useAlphaPlaytest() {
  const storageRef = useRef(getStorage());
  const [session, setSession] = useState<PlaytestSession | null>(() =>
    loadPlaytestSession(storageRef.current),
  );
  const sessionRef = useRef(session);
  const contextRef = useRef<PlaytestContext>(EMPTY_CONTEXT);
  const [safeForCheckpoint, setSafeForCheckpoint] = useState(true);

  sessionRef.current = session;

  useEffect(() => {
    if (session) writePlaytestSession(storageRef.current, session);
  }, [session]);

  useEffect(() => {
    if (!session?.enabled) return;
    let lastAdvance = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === 'visible') {
        const elapsed = now - lastAdvance;
        setSession((current) => {
          if (!current?.enabled) return current;
          return advancePlaytestSession(current, elapsed);
        });
      }
      lastAdvance = now;
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [session?.enabled]);

  const updateSession = useCallback(
    (update: (current: PlaytestSession) => PlaytestSession) => {
      setSession((current) =>
        current?.enabled ? update(current) : current,
      );
    },
    [],
  );

  const setContext = useCallback((context: PlaytestContext) => {
    contextRef.current = { ...context };
  }, []);

  const updateContext = useCallback(
    (context: Partial<PlaytestContext>) => {
      contextRef.current = {
        ...contextRef.current,
        ...context,
      };
    },
    [],
  );

  const enable = useCallback((saveSchemaVersion: number) => {
    setSession((current) =>
      current
        ? { ...current, enabled: true }
        : createPlaytestSession({
            gameVersion: __GYM_BUDDIES_VERSION__,
            buildId: __GYM_BUDDIES_BUILD_ID__,
            saveSchemaVersion,
          }),
    );
  }, []);

  const disable = useCallback(() => {
    setSession((current) =>
      current ? { ...current, enabled: false } : null,
    );
  }, []);

  const recordEvent = useCallback(
    (kind: PlaytestTimelineEventKind, label: string) => {
      updateSession((current) =>
        appendPlaytestEvent(current, {
          kind,
          label,
          context: contextRef.current,
        }),
      );
    },
    [updateSession],
  );

  const increment = useCallback(
    (key: PlaytestCounterKey, amount = 1) => {
      updateSession((current) =>
        incrementPlaytestCounter(current, key, amount),
      );
    },
    [updateSession],
  );

  const queueCheckpoint = useCallback(
    (checkpointId: PlaytestCheckpointId) => {
      updateSession((current) =>
        queuePlaytestCheckpoint(current, checkpointId),
      );
    },
    [updateSession],
  );

  const submitCheckpoint = useCallback(
    (
      checkpointId: PlaytestCheckpointId,
      ratings: PlaytestRatings,
      note: string,
    ) => {
      updateSession((current) =>
        addCheckpointFeedback(current, {
          checkpointId,
          ratings,
          note,
          context: contextRef.current,
        }),
      );
    },
    [updateSession],
  );

  const dismissCheckpoint = useCallback(
    (checkpointId: PlaytestCheckpointId) => {
      updateSession((current) =>
        dismissPlaytestCheckpoint(current, checkpointId),
      );
    },
    [updateSession],
  );

  const addQuickNote = useCallback(
    (category: PlaytestNoteCategory, note: string) => {
      updateSession((current) =>
        addQuickPlaytestNote(current, {
          category,
          note,
          context: contextRef.current,
        }),
      );
    },
    [updateSession],
  );

  const recordError = useCallback(
    (
      category: PlaytestErrorCategory,
      safeMessage: string,
    ) => {
      updateSession((current) =>
        addPlaytestError(current, {
          category,
          safeMessage,
          context: contextRef.current,
        }),
      );
    },
    [updateSession],
  );

  const toggleCohort = useCallback((cohort: PlaytestCohortId) => {
    updateSession((current) => ({
      ...current,
      cohortLabels: current.cohortLabels.includes(cohort)
        ? current.cohortLabels.filter((id) => id !== cohort)
        : [...current.cohortLabels, cohort],
    }));
  }, [updateSession]);

  const markChecklist = useCallback(
    (id: PlaytestChecklistId, complete: boolean) => {
      updateSession((current) => ({
        ...current,
        checklist: { ...current.checklist, [id]: complete },
      }));
    },
    [updateSession],
  );

  const removeFeedback = useCallback((feedbackId: string) => {
    updateSession((current) =>
      removePlaytestFeedback(current, feedbackId),
    );
  }, [updateSession]);

  const createReport = useCallback(
    (options: PlaytestReportOptions) => {
      const current = sessionRef.current;
      if (!current) return null;
      const context = contextRef.current;
      return createPlaytestReport(current, options, {
        currentGym: context.gymId,
        currentRoute: context.routeId,
        trainerLevel: context.trainerLevel,
        activeBuddyLevel: context.activeBuddyLevel,
        partySize: context.partySize,
        fatigueRange: context.fatigueRange,
        tutorialStep: context.tutorialStep,
        completedBosses: context.completedBosses,
      });
    },
    [],
  );

  return {
    session,
    enabled: session?.enabled ?? false,
    safeForCheckpoint,
    setSafeForCheckpoint,
    setContext,
    updateContext,
    enable,
    disable,
    recordEvent,
    increment,
    queueCheckpoint,
    submitCheckpoint,
    dismissCheckpoint,
    addQuickNote,
    recordError,
    toggleCohort,
    markChecklist,
    removeFeedback,
    createReport,
  } as const;
}
