import { describe, expect, it, vi } from 'vitest';

import {
  addPlaytestError,
  addQuickPlaytestNote,
  advancePlaytestSession,
  appendPlaytestEvent,
  createPlaytestReport,
  createPlaytestSession,
  loadPlaytestSession,
  PLAYTEST_TIMELINE_MAX_BYTES,
  PLAYTEST_TIMELINE_MAX_EVENTS,
} from '../game/playtest/playtestService';
import {
  PLAYTEST_REPORT_MAX_BYTES,
  validatePlaytestReportJson,
} from '../game/playtest/playtestValidation';
import type { PlaytestContext } from '../game/playtest/types';
import { createDefaultSaveData } from '../game/save/saveDefaults';

const context: PlaytestContext = {
  mode: 'journey',
  gymId: 'home',
  routeId: null,
  trainerLevel: 4,
  activeBuddyLevel: 5,
  partySize: 2,
  fatigueRange: 'building',
  tutorialStep: 2,
  completedBosses: 0,
  overlay: 'none',
};

function session() {
  return createPlaytestSession({
    gameVersion: '0.12.0',
    buildId: 'test-build',
    saveSchemaVersion: 19,
    now: new Date('2026-07-30T12:00:00.000Z'),
    environment: {
      browserFamily: 'chrome',
      operatingSystemFamily: 'windows',
      screenWidth: 1280,
      screenHeight: 720,
      touchAvailable: false,
      gamepadAvailable: false,
    },
  });
}

describe('alpha playtest privacy and storage', () => {
  it('is disabled by default and makes no network requests', () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('network must not be used'));
    expect(loadPlaytestSession(null)).toBeNull();
    expect(
      loadPlaytestSession({ getItem: () => null }),
    ).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('bounds the event timeline by count and serialized size', () => {
    let current = session();
    for (let index = 0; index < 300; index += 1) {
      current = appendPlaytestEvent(current, {
        kind: 'location-entered',
        label: `Route event ${index} ${'x'.repeat(900)}`,
        context,
      });
    }
    expect(current.timeline.length).toBeLessThanOrEqual(
      PLAYTEST_TIMELINE_MAX_EVENTS,
    );
    expect(
      new TextEncoder().encode(JSON.stringify(current.timeline)).length,
    ).toBeLessThanOrEqual(PLAYTEST_TIMELINE_MAX_BYTES);
  });

  it('queues the twenty-minute checkpoint once without timing flakiness', () => {
    let almost = session();
    for (let minute = 1; minute <= 19; minute += 1) {
      almost = advancePlaytestSession(
        almost,
        60_000,
        new Date(
          `2026-07-30T12:${String(minute).padStart(2, '0')}:00.000Z`,
        ),
      );
    }
    expect(almost.pendingCheckpoints).not.toContain(
      'twenty-minutes',
    );
    const reached = advancePlaytestSession(
      almost,
      60_000,
      new Date('2026-07-30T12:20:00.000Z'),
    );
    expect(reached.pendingCheckpoints).toEqual([
      'twenty-minutes',
    ]);
    expect(
      advancePlaytestSession(reached, 60_000).pendingCheckpoints,
    ).toEqual(['twenty-minutes']);
  });

  it('redacts environment and timeline while retaining explicit feedback', () => {
    const withNote = addQuickPlaytestNote(session(), {
      category: 'liked',
      note: 'The timing bar felt clear.',
      context,
    });
    const report = createPlaytestReport(
      withNote,
      { includeEnvironment: false, includeTimeline: false },
      {
        currentGym: 'home',
        currentRoute: null,
        trainerLevel: 4,
        activeBuddyLevel: 5,
        partySize: 2,
        fatigueRange: 'building',
        tutorialStep: 2,
        completedBosses: 0,
      },
    );
    expect(report.session.environment).toBeUndefined();
    expect(report.session.timeline).toBeUndefined();
    expect(report.session.feedback[0].note).toBe(
      'The timing bar felt clear.',
    );
  });

  it('records safe boundary diagnostics without mutating the save', () => {
    const save = createDefaultSaveData();
    const before = JSON.stringify(save);
    const current = appendPlaytestEvent(session(), {
      kind: 'save-loaded',
      label: 'Validated save loaded',
      context,
    });
    const diagnosed = addPlaytestError(current, {
      category: 'journey-ui',
      safeMessage: 'The journey entered recovery.',
      context,
    });
    expect(JSON.stringify(save)).toBe(before);
    expect(diagnosed.errors).toHaveLength(1);
    expect(diagnosed.errors[0]).toMatchObject({
      category: 'journey-ui',
      safeMessage: 'The journey entered recovery.',
      mode: 'journey',
      locationId: 'home',
      overlay: 'none',
      buildId: 'test-build',
      saveSchemaVersion: 19,
    });
    expect(diagnosed.errors[0].recentTimeline).toHaveLength(1);
  });

  it('validates exported reports and rejects malformed or oversized input', () => {
    const valid = createPlaytestReport(
      session(),
      { includeEnvironment: true, includeTimeline: true },
      {
        currentGym: 'home',
        currentRoute: null,
        trainerLevel: 4,
        activeBuddyLevel: 5,
        partySize: 2,
        fatigueRange: 'building',
        tutorialStep: 2,
        completedBosses: 0,
      },
    );
    expect(
      validatePlaytestReportJson(JSON.stringify(valid)).ok,
    ).toBe(true);
    expect(validatePlaytestReportJson('{bad json')).toEqual({
      ok: false,
      message: 'That file is not valid JSON.',
    });
    expect(
      validatePlaytestReportJson(
        JSON.stringify({ format: 'not-gym-buddies' }),
      ).ok,
    ).toBe(false);
    expect(
      validatePlaytestReportJson(
        'x'.repeat(PLAYTEST_REPORT_MAX_BYTES + 1),
      ),
    ).toEqual({
      ok: false,
      message:
        'That playtest report is larger than the 512 KB limit.',
    });
  });
});
