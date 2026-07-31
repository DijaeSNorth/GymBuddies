export const PLAYTEST_REPORT_FORMAT = 'gym-buddies-alpha-playtest';
export const PLAYTEST_REPORT_VERSION = 1;

export const PLAYTEST_COHORT_IDS = [
  'new-to-games',
  'rpg-familiar',
  'creature-collection-fan',
  'fitness-enthusiast',
  'bodybuilding-enthusiast',
  'mobile-player',
  'desktop-player',
  'accessibility-tester',
] as const;

export type PlaytestCohortId = (typeof PLAYTEST_COHORT_IDS)[number];

export const PLAYTEST_NOTE_CATEGORIES = [
  'bug',
  'confusing',
  'too-difficult',
  'too-easy',
  'repetitive',
  'visual-issue',
  'control-issue',
  'performance-issue',
  'save-issue',
  'liked',
] as const;

export type PlaytestNoteCategory =
  (typeof PLAYTEST_NOTE_CATEGORIES)[number];

export const PLAYTEST_CHECKPOINT_IDS = [
  'trainer-created',
  'first-workout',
  'first-route',
  'first-encounter',
  'first-capture-success',
  'first-capture-failure',
  'first-boss',
  'twenty-minutes',
  'session-end',
] as const;

export type PlaytestCheckpointId =
  (typeof PLAYTEST_CHECKPOINT_IDS)[number];

export const PLAYTEST_CHECKLIST_IDS = [
  'new-journey',
  'trainer',
  'workout',
  'route',
  'encounter',
  'capture',
  'buddy-customization',
  'recovery',
  'boss',
  'reopen',
  'alternate-control',
  'feedback-export',
] as const;

export type PlaytestChecklistId =
  (typeof PLAYTEST_CHECKLIST_IDS)[number];

export type PlaytestGameMode =
  | 'opening'
  | 'trainer-creation'
  | 'journey';

export type PlaytestFatigueRange =
  | 'rested'
  | 'building'
  | 'high'
  | 'peak';

export type PlaytestContext = {
  mode: PlaytestGameMode;
  gymId: string | null;
  routeId: string | null;
  trainerLevel: number;
  activeBuddyLevel: number | null;
  partySize: number;
  fatigueRange: PlaytestFatigueRange;
  tutorialStep: number;
  completedBosses: number;
  overlay: string;
};

export type PlaytestEnvironment = {
  browserFamily: 'chrome' | 'edge' | 'firefox' | 'safari' | 'other';
  operatingSystemFamily:
    | 'android'
    | 'ios'
    | 'windows'
    | 'macos'
    | 'linux'
    | 'other';
  screenWidth: number;
  screenHeight: number;
  touchAvailable: boolean;
  gamepadAvailable: boolean;
};

export type PlaytestCounters = {
  encountersAttempted: number;
  capturesAttempted: number;
  capturesCompleted: number;
  workoutsAttempted: number;
  workoutFailures: number;
  recoveryActions: number;
  majorErrors: number;
  unexpectedReloadRecoveries: number;
};

export type PlaytestTimelineEventKind =
  | 'location-entered'
  | 'machine-used'
  | 'workout-completed'
  | 'encounter-started'
  | 'capture-result'
  | 'boss-result'
  | 'recovery-used'
  | 'save-loaded'
  | 'save-migrated'
  | 'error-boundary'
  | 'journey-retried'
  | 'phaser-recovered'
  | 'feedback';

export type PlaytestTimelineEvent = {
  id: string;
  at: string;
  kind: PlaytestTimelineEventKind;
  label: string;
  context: PlaytestContext;
};

export type PlaytestRatings = {
  clarity?: 'clear' | 'confusing';
  enjoyment?: 'fun' | 'boring';
  fairness?: 'fair' | 'unfair';
  difficulty?: 'too-easy' | 'balanced' | 'too-hard';
  pace?: 'too-slow' | 'balanced' | 'too-fast';
};

export type PlaytestFeedback = {
  id: string;
  createdAt: string;
  source: 'quick-note' | 'checkpoint';
  category: PlaytestNoteCategory | null;
  checkpointId: PlaytestCheckpointId | null;
  ratings: PlaytestRatings;
  note: string;
  context: PlaytestContext;
};

export type PlaytestErrorCategory =
  | 'application'
  | 'journey-ui'
  | 'phaser-presentation'
  | 'lazy-module';

export type PlaytestErrorSummary = {
  id: string;
  at: string;
  category: PlaytestErrorCategory;
  safeMessage: string;
  mode: PlaytestGameMode;
  locationId: string | null;
  overlay: string;
  buildId: string;
  saveSchemaVersion: number;
  recentTimeline: PlaytestTimelineEvent[];
};

export type PlaytestSession = {
  format: typeof PLAYTEST_REPORT_FORMAT;
  reportVersion: typeof PLAYTEST_REPORT_VERSION;
  enabled: boolean;
  sessionId: string;
  gameVersion: string;
  buildId: string;
  saveSchemaVersion: number;
  startedAt: string;
  lastActiveAt: string;
  activeDurationMs: number;
  environment: PlaytestEnvironment;
  cohortLabels: PlaytestCohortId[];
  counters: PlaytestCounters;
  pendingCheckpoints: PlaytestCheckpointId[];
  completedCheckpoints: PlaytestCheckpointId[];
  feedback: PlaytestFeedback[];
  timeline: PlaytestTimelineEvent[];
  errors: PlaytestErrorSummary[];
  checklist: Partial<Record<PlaytestChecklistId, boolean>>;
};

export type PlaytestProgressionSummary = {
  currentGym: string | null;
  currentRoute: string | null;
  trainerLevel: number;
  activeBuddyLevel: number | null;
  partySize: number;
  fatigueRange: PlaytestFatigueRange;
  tutorialStep: number;
  completedBosses: number;
};

export type PlaytestReport = {
  format: typeof PLAYTEST_REPORT_FORMAT;
  reportVersion: typeof PLAYTEST_REPORT_VERSION;
  exportedAt: string;
  session: Omit<
    PlaytestSession,
    'enabled' | 'environment' | 'timeline'
  > & {
    environment?: PlaytestEnvironment;
    timeline?: PlaytestTimelineEvent[];
  };
  progression: PlaytestProgressionSummary;
};

export type PlaytestReportOptions = {
  includeEnvironment: boolean;
  includeTimeline: boolean;
};

export type PlaytestCounterKey = keyof PlaytestCounters;
