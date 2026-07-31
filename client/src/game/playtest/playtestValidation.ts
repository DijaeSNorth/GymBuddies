import {
  PLAYTEST_CHECKPOINT_IDS,
  PLAYTEST_COHORT_IDS,
  PLAYTEST_NOTE_CATEGORIES,
  PLAYTEST_REPORT_FORMAT,
  PLAYTEST_REPORT_VERSION,
  type PlaytestReport,
} from './types';

export const PLAYTEST_REPORT_MAX_BYTES = 512 * 1024;

export type PlaytestReportValidation =
  | { ok: true; report: PlaytestReport }
  | { ok: false; message: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown, maximum = 512) {
  return typeof value === 'string' && value.length <= maximum;
}

export function validatePlaytestReportJson(
  text: string,
): PlaytestReportValidation {
  if (new TextEncoder().encode(text).length > PLAYTEST_REPORT_MAX_BYTES) {
    return {
      ok: false,
      message: 'That playtest report is larger than the 512 KB limit.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      message: 'That file is not valid JSON.',
    };
  }

  if (
    !isObject(parsed) ||
    parsed.format !== PLAYTEST_REPORT_FORMAT ||
    parsed.reportVersion !== PLAYTEST_REPORT_VERSION ||
    !isString(parsed.exportedAt, 64) ||
    !isObject(parsed.session) ||
    !isObject(parsed.progression)
  ) {
    return {
      ok: false,
      message: 'That file is not a Gym Buddies alpha playtest report.',
    };
  }

  const session = parsed.session;
  if (
    !isString(session.sessionId, 80) ||
    !isString(session.gameVersion, 40) ||
    !isString(session.buildId, 80) ||
    typeof session.saveSchemaVersion !== 'number' ||
    !Array.isArray(session.feedback) ||
    session.feedback.length > 50 ||
    !Array.isArray(session.errors) ||
    session.errors.length > 20 ||
    !Array.isArray(session.cohortLabels) ||
    session.cohortLabels.some(
      (id) =>
        typeof id !== 'string' ||
        !PLAYTEST_COHORT_IDS.includes(
          id as (typeof PLAYTEST_COHORT_IDS)[number],
        ),
    )
  ) {
    return {
      ok: false,
      message: 'The report session summary is malformed.',
    };
  }

  const invalidFeedback = session.feedback.some((entry) => {
    if (!isObject(entry)) return true;
    if (!isString(entry.id, 100) || !isString(entry.note, 280)) {
      return true;
    }
    if (
      entry.category !== null &&
      (typeof entry.category !== 'string' ||
        !PLAYTEST_NOTE_CATEGORIES.includes(
          entry.category as (typeof PLAYTEST_NOTE_CATEGORIES)[number],
        ))
    ) {
      return true;
    }
    return (
      entry.checkpointId !== null &&
      (typeof entry.checkpointId !== 'string' ||
        !PLAYTEST_CHECKPOINT_IDS.includes(
          entry.checkpointId as (typeof PLAYTEST_CHECKPOINT_IDS)[number],
        ))
    );
  });
  if (invalidFeedback) {
    return {
      ok: false,
      message: 'The report contains malformed feedback entries.',
    };
  }

  if (
    session.timeline !== undefined &&
    (!Array.isArray(session.timeline) || session.timeline.length > 120)
  ) {
    return {
      ok: false,
      message: 'The report timeline is malformed or exceeds 120 events.',
    };
  }

  return { ok: true, report: parsed as PlaytestReport };
}
