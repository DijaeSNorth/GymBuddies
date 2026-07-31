import {
  PLAYTEST_CHECKLIST_IDS,
  PLAYTEST_REPORT_FORMAT,
  PLAYTEST_REPORT_VERSION,
  type PlaytestCheckpointId,
  type PlaytestContext,
  type PlaytestCounterKey,
  type PlaytestEnvironment,
  type PlaytestErrorCategory,
  type PlaytestFeedback,
  type PlaytestNoteCategory,
  type PlaytestProgressionSummary,
  type PlaytestRatings,
  type PlaytestReport,
  type PlaytestReportOptions,
  type PlaytestSession,
  type PlaytestTimelineEvent,
  type PlaytestTimelineEventKind,
} from './types';

export const PLAYTEST_STORAGE_KEY =
  'gym-buddies-alpha-playtest-session-v1';
export const PLAYTEST_TIMELINE_MAX_EVENTS = 120;
export const PLAYTEST_TIMELINE_MAX_BYTES = 48 * 1024;
export const PLAYTEST_SESSION_MAX_BYTES = 192 * 1024;
const PLAYTEST_FEEDBACK_MAX = 50;
const PLAYTEST_ERRORS_MAX = 20;
const NOTE_MAX_LENGTH = 280;

const EMPTY_COUNTERS = {
  encountersAttempted: 0,
  capturesAttempted: 0,
  capturesCompleted: 0,
  workoutsAttempted: 0,
  workoutFailures: 0,
  recoveryActions: 0,
  majorErrors: 0,
  unexpectedReloadRecoveries: 0,
} as const;

function byteLength(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function randomToken() {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  const bytes = new Uint8Array(16);
  cryptoApi?.getRandomValues(bytes);
  return Array.from(bytes, (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('');
}

function safeText(value: string, maximum: number) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximum);
}

function nextId(prefix: string) {
  return `${prefix}-${randomToken()}`;
}

export function detectPlaytestEnvironment(): PlaytestEnvironment {
  const agent =
    typeof navigator === 'undefined'
      ? ''
      : navigator.userAgent.toLowerCase();
  const browserFamily = agent.includes('edg/')
    ? 'edge'
    : agent.includes('firefox/')
      ? 'firefox'
      : agent.includes('chrome/') || agent.includes('crios/')
        ? 'chrome'
        : agent.includes('safari/')
          ? 'safari'
          : 'other';
  const operatingSystemFamily = agent.includes('android')
    ? 'android'
    : /iphone|ipad|ipod/.test(agent)
      ? 'ios'
      : agent.includes('windows')
        ? 'windows'
        : agent.includes('mac os')
          ? 'macos'
          : agent.includes('linux')
            ? 'linux'
            : 'other';
  return {
    browserFamily,
    operatingSystemFamily,
    screenWidth:
      typeof window === 'undefined' ? 0 : Math.round(window.innerWidth),
    screenHeight:
      typeof window === 'undefined' ? 0 : Math.round(window.innerHeight),
    touchAvailable:
      typeof navigator !== 'undefined' &&
      (navigator.maxTouchPoints > 0 || 'ontouchstart' in window),
    gamepadAvailable:
      typeof navigator !== 'undefined' &&
      typeof navigator.getGamepads === 'function' &&
      Array.from(navigator.getGamepads()).some(Boolean),
  };
}

export function createPlaytestSession(input: {
  gameVersion: string;
  buildId: string;
  saveSchemaVersion: number;
  now?: Date;
  environment?: PlaytestEnvironment;
}): PlaytestSession {
  const now = input.now ?? new Date();
  return {
    format: PLAYTEST_REPORT_FORMAT,
    reportVersion: PLAYTEST_REPORT_VERSION,
    enabled: true,
    sessionId: randomToken(),
    gameVersion: input.gameVersion,
    buildId: input.buildId,
    saveSchemaVersion: input.saveSchemaVersion,
    startedAt: now.toISOString(),
    lastActiveAt: now.toISOString(),
    activeDurationMs: 0,
    environment: input.environment ?? detectPlaytestEnvironment(),
    cohortLabels: [],
    counters: { ...EMPTY_COUNTERS },
    pendingCheckpoints: [],
    completedCheckpoints: [],
    feedback: [],
    timeline: [],
    errors: [],
    checklist: Object.fromEntries(
      PLAYTEST_CHECKLIST_IDS.map((id) => [id, false]),
    ),
  };
}

function boundTimeline(events: readonly PlaytestTimelineEvent[]) {
  const bounded = events.slice(-PLAYTEST_TIMELINE_MAX_EVENTS);
  while (
    bounded.length > 0 &&
    byteLength(bounded) > PLAYTEST_TIMELINE_MAX_BYTES
  ) {
    bounded.shift();
  }
  return bounded;
}

export function appendPlaytestEvent(
  session: PlaytestSession,
  input: {
    kind: PlaytestTimelineEventKind;
    label: string;
    context: PlaytestContext;
    at?: Date;
  },
): PlaytestSession {
  if (!session.enabled) return session;
  const event: PlaytestTimelineEvent = {
    id: nextId('event'),
    at: (input.at ?? new Date()).toISOString(),
    kind: input.kind,
    label: safeText(input.label, 120),
    context: { ...input.context },
  };
  return {
    ...session,
    timeline: boundTimeline([...session.timeline, event]),
  };
}

export function incrementPlaytestCounter(
  session: PlaytestSession,
  key: PlaytestCounterKey,
  amount = 1,
) {
  if (!session.enabled || amount <= 0) return session;
  return {
    ...session,
    counters: {
      ...session.counters,
      [key]: session.counters[key] + Math.floor(amount),
    },
  };
}

export function queuePlaytestCheckpoint(
  session: PlaytestSession,
  checkpointId: PlaytestCheckpointId,
) {
  if (
    !session.enabled ||
    session.pendingCheckpoints.includes(checkpointId) ||
    session.completedCheckpoints.includes(checkpointId)
  ) {
    return session;
  }
  return {
    ...session,
    pendingCheckpoints: [
      ...session.pendingCheckpoints,
      checkpointId,
    ],
  };
}

export function addCheckpointFeedback(
  session: PlaytestSession,
  input: {
    checkpointId: PlaytestCheckpointId;
    ratings: PlaytestRatings;
    note: string;
    context: PlaytestContext;
    at?: Date;
  },
) {
  if (!session.enabled) return session;
  const feedback: PlaytestFeedback = {
    id: nextId('feedback'),
    createdAt: (input.at ?? new Date()).toISOString(),
    source: 'checkpoint',
    category: null,
    checkpointId: input.checkpointId,
    ratings: { ...input.ratings },
    note: safeText(input.note, NOTE_MAX_LENGTH),
    context: { ...input.context },
  };
  return appendPlaytestEvent(
    {
      ...session,
      pendingCheckpoints: session.pendingCheckpoints.filter(
        (id) => id !== input.checkpointId,
      ),
      completedCheckpoints: Array.from(
        new Set([
          ...session.completedCheckpoints,
          input.checkpointId,
        ]),
      ),
      feedback: [...session.feedback, feedback].slice(
        -PLAYTEST_FEEDBACK_MAX,
      ),
    },
    {
      kind: 'feedback',
      label: `Checkpoint feedback: ${input.checkpointId}`,
      context: input.context,
      at: input.at,
    },
  );
}

export function dismissPlaytestCheckpoint(
  session: PlaytestSession,
  checkpointId: PlaytestCheckpointId,
) {
  return {
    ...session,
    pendingCheckpoints: session.pendingCheckpoints.filter(
      (id) => id !== checkpointId,
    ),
    completedCheckpoints: Array.from(
      new Set([...session.completedCheckpoints, checkpointId]),
    ),
  };
}

export function addQuickPlaytestNote(
  session: PlaytestSession,
  input: {
    category: PlaytestNoteCategory;
    note: string;
    context: PlaytestContext;
    at?: Date;
  },
) {
  if (!session.enabled) return session;
  const feedback: PlaytestFeedback = {
    id: nextId('feedback'),
    createdAt: (input.at ?? new Date()).toISOString(),
    source: 'quick-note',
    category: input.category,
    checkpointId: null,
    ratings: {},
    note: safeText(input.note, NOTE_MAX_LENGTH),
    context: { ...input.context },
  };
  return appendPlaytestEvent(
    {
      ...session,
      feedback: [...session.feedback, feedback].slice(
        -PLAYTEST_FEEDBACK_MAX,
      ),
    },
    {
      kind: 'feedback',
      label: `Playtest note: ${input.category}`,
      context: input.context,
      at: input.at,
    },
  );
}

export function addPlaytestError(
  session: PlaytestSession,
  input: {
    category: PlaytestErrorCategory;
    safeMessage: string;
    context: PlaytestContext;
    at?: Date;
  },
) {
  if (!session.enabled) return session;
  const at = input.at ?? new Date();
  const error = {
    id: nextId('error'),
    at: at.toISOString(),
    category: input.category,
    safeMessage: safeText(input.safeMessage, 160),
    mode: input.context.mode,
    locationId: input.context.routeId ?? input.context.gymId,
    overlay: input.context.overlay,
    buildId: session.buildId,
    saveSchemaVersion: session.saveSchemaVersion,
    recentTimeline: session.timeline.slice(-25),
  };
  const next = incrementPlaytestCounter(
    {
      ...session,
      errors: [...session.errors, error].slice(-PLAYTEST_ERRORS_MAX),
    },
    'majorErrors',
  );
  return appendPlaytestEvent(next, {
    kind: 'error-boundary',
    label: `${input.category} recovery activated`,
    context: input.context,
    at,
  });
}

export function advancePlaytestDuration(
  session: PlaytestSession,
  elapsedMs: number,
  now = new Date(),
) {
  if (!session.enabled || elapsedMs <= 0) return session;
  return {
    ...session,
    activeDurationMs:
      session.activeDurationMs + Math.min(elapsedMs, 60_000),
    lastActiveAt: now.toISOString(),
  };
}

export function advancePlaytestSession(
  session: PlaytestSession,
  elapsedMs: number,
  now = new Date(),
) {
  const advanced = advancePlaytestDuration(session, elapsedMs, now);
  return advanced.activeDurationMs >= 20 * 60_000
    ? queuePlaytestCheckpoint(advanced, 'twenty-minutes')
    : advanced;
}

export function removePlaytestFeedback(
  session: PlaytestSession,
  feedbackId: string,
) {
  return {
    ...session,
    feedback: session.feedback.filter(
      (entry) => entry.id !== feedbackId,
    ),
  };
}

export function createPlaytestReport(
  session: PlaytestSession,
  options: PlaytestReportOptions,
  progression: PlaytestProgressionSummary,
  now = new Date(),
): PlaytestReport {
  const {
    enabled: _enabled,
    environment,
    timeline,
    ...sessionSummary
  } = session;
  return {
    format: PLAYTEST_REPORT_FORMAT,
    reportVersion: PLAYTEST_REPORT_VERSION,
    exportedAt: now.toISOString(),
    session: {
      ...sessionSummary,
      ...(options.includeEnvironment ? { environment } : {}),
      ...(options.includeTimeline ? { timeline } : {}),
    },
    progression: { ...progression },
  };
}

export function boundPlaytestSession(
  session: PlaytestSession,
): PlaytestSession {
  let next = {
    ...session,
    feedback: session.feedback.slice(-PLAYTEST_FEEDBACK_MAX),
    errors: session.errors.slice(-PLAYTEST_ERRORS_MAX),
    timeline: boundTimeline(session.timeline),
  };
  while (
    next.timeline.length > 0 &&
    byteLength(next) > PLAYTEST_SESSION_MAX_BYTES
  ) {
    next = { ...next, timeline: next.timeline.slice(1) };
  }
  return next;
}

export function loadPlaytestSession(
  storage: Pick<Storage, 'getItem'> | null,
): PlaytestSession | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(PLAYTEST_STORAGE_KEY);
    if (!raw || new TextEncoder().encode(raw).length > PLAYTEST_SESSION_MAX_BYTES) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PlaytestSession>;
    if (
      parsed.format !== PLAYTEST_REPORT_FORMAT ||
      parsed.reportVersion !== PLAYTEST_REPORT_VERSION ||
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.enabled !== 'boolean' ||
      !Array.isArray(parsed.timeline) ||
      !Array.isArray(parsed.feedback) ||
      !Array.isArray(parsed.errors)
    ) {
      return null;
    }
    return boundPlaytestSession(parsed as PlaytestSession);
  } catch {
    return null;
  }
}

export function writePlaytestSession(
  storage: Pick<Storage, 'setItem'> | null,
  session: PlaytestSession,
) {
  if (!storage) return false;
  try {
    storage.setItem(
      PLAYTEST_STORAGE_KEY,
      JSON.stringify(boundPlaytestSession(session)),
    );
    return true;
  } catch {
    return false;
  }
}
