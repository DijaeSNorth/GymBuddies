import { useMemo, useState } from 'react';

import {
  PLAYTEST_CHECKLIST_IDS,
  PLAYTEST_COHORT_IDS,
  PLAYTEST_NOTE_CATEGORIES,
  type PlaytestCheckpointId,
  type PlaytestNoteCategory,
  type PlaytestRatings,
} from '../../game/playtest/types';
import type { AlphaPlaytestController } from './useAlphaPlaytest';
import './alphaPlaytest.css';

const COHORT_LABELS = {
  'new-to-games': 'New to games',
  'rpg-familiar': 'Familiar with RPGs',
  'creature-collection-fan': 'Creature-collection fan',
  'fitness-enthusiast': 'Fitness enthusiast',
  'bodybuilding-enthusiast': 'Bodybuilding enthusiast',
  'mobile-player': 'Mobile player',
  'desktop-player': 'Desktop player',
  'accessibility-tester': 'Accessibility tester',
} as const;

const NOTE_CATEGORY_LABELS = {
  bug: 'Bug',
  confusing: 'Confusing',
  'too-difficult': 'Too difficult',
  'too-easy': 'Too easy',
  repetitive: 'Repetitive',
  'visual-issue': 'Visual issue',
  'control-issue': 'Control issue',
  'performance-issue': 'Performance issue',
  'save-issue': 'Save issue',
  liked: 'Something I liked',
} as const;

const CHECKPOINT_LABELS: Record<PlaytestCheckpointId, string> = {
  'trainer-created': 'How clear was trainer creation?',
  'first-workout': 'How did the first workout feel?',
  'first-route': 'Was reaching and reading the first route clear?',
  'first-encounter': 'Was the first wild encounter understandable?',
  'first-capture-success': 'How did the successful capture feel?',
  'first-capture-failure': 'Did the failed capture feel fair?',
  'first-boss': 'Were the boss requirements understandable?',
  'twenty-minutes': 'How has the pace felt after about 20 minutes?',
  'session-end': 'How did this playtest session feel overall?',
};

const CHECKLIST_LABELS = {
  'new-journey': 'Start a new journey',
  trainer: 'Create a trainer',
  workout: 'Complete the first workout',
  route: 'Travel to the first route',
  encounter: 'Trigger an encounter',
  capture: 'Attempt a capture',
  'buddy-customization': 'Customize a Buddy',
  recovery: 'Use recovery',
  boss: 'Attempt a boss',
  reopen: 'Close and reopen the game',
  'alternate-control': 'Try one alternative control method',
  'feedback-export': 'Submit or export feedback',
} as const;

type AlphaPlaytestPanelProps = Readonly<{
  controller: AlphaPlaytestController;
  saveSchemaVersion: number;
  onClose: () => void;
}>;

function downloadReport(
  report: NonNullable<
    ReturnType<AlphaPlaytestController['createReport']>
  >,
) {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download =
    `gym-buddies-playtest-${report.session.gameVersion}-` +
    `${report.session.sessionId}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AlphaPlaytestPanel({
  controller,
  saveSchemaVersion,
  onClose,
}: AlphaPlaytestPanelProps) {
  const [quickCategory, setQuickCategory] =
    useState<PlaytestNoteCategory>('bug');
  const [quickNote, setQuickNote] = useState('');
  const [checkpointNote, setCheckpointNote] = useState('');
  const [ratings, setRatings] = useState<PlaytestRatings>({});
  const [includeEnvironment, setIncludeEnvironment] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [status, setStatus] = useState('');
  const session = controller.session;
  const pendingCheckpoint =
    controller.enabled && controller.safeForCheckpoint
      ? session?.pendingCheckpoints[0] ?? null
      : null;
  const reportPreview = useMemo(
    () =>
      controller.createReport({
        includeEnvironment,
        includeTimeline,
      }),
    [
      controller,
      includeEnvironment,
      includeTimeline,
      session,
    ],
  );

  function submitQuickNote() {
    controller.addQuickNote(quickCategory, quickNote);
    setQuickNote('');
    setStatus('Playtest note stored locally.');
  }

  function submitCheckpoint(checkpointId: PlaytestCheckpointId) {
    controller.submitCheckpoint(
      checkpointId,
      ratings,
      checkpointNote,
    );
    setRatings({});
    setCheckpointNote('');
    setStatus('Checkpoint feedback stored locally.');
  }

  function exportReport() {
    const report = controller.createReport({
      includeEnvironment,
      includeTimeline,
    });
    if (!report) return;
    downloadReport(report);
    controller.markChecklist('feedback-export', true);
    setStatus(
      'Report downloaded. Nothing was uploaded; send it only if you choose.',
    );
  }

  return (
    <div
      className="playtest-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
          <section
            aria-labelledby="alpha-playtest-title"
            aria-modal="true"
            className="playtest-panel"
            data-testid="alpha-playtest-panel"
            role="dialog"
          >
            <div className="panel-head-row playtest-panel-heading">
              <div>
                <p className="trainer-kicker">Local, optional feedback</p>
                <h2 id="alpha-playtest-title">Alpha Playtest Mode</h2>
              </div>
              <button
                aria-label="Close Alpha Playtest Mode"
                className="secondary-btn"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="playtest-privacy-summary">
              <strong>No account and no automatic upload.</strong>
              <p>
                Gym Buddies stores bounded gameplay notes in this browser.
                It does not collect conversations, real names, email
                addresses, IP addresses, precise location, advertising IDs,
                or a full device fingerprint.
              </p>
              <p>
                You decide whether to export a report and send it manually.
                The game remains fully playable with this mode off.
              </p>
            </div>

            {!controller.enabled ? (
              <div className="playtest-enable-card">
                <p>
                  Enabling starts a random local session ID and records only
                  coarse environment details, progression summaries, bounded
                  milestone events, and feedback you explicitly submit.
                </p>
                <button
                  className="primary-btn"
                  data-testid="enable-alpha-playtest"
                  onClick={() => controller.enable(saveSchemaVersion)}
                  type="button"
                >
                  Enable Alpha Playtest Mode
                </button>
              </div>
            ) : (
              <>
                <div className="playtest-session-strip">
                  <span>
                    Session {session?.sessionId.slice(0, 8)}
                  </span>
                  <span>Version {session?.gameVersion}</span>
                  <span>Stored locally</span>
                  <button
                    className="secondary-btn micro-btn"
                    onClick={controller.disable}
                    type="button"
                  >
                    Disable mode
                  </button>
                </div>

                {pendingCheckpoint ? (
                  <fieldset className="playtest-section">
                    <legend>Optional checkpoint</legend>
                    <strong>{CHECKPOINT_LABELS[pendingCheckpoint]}</strong>
                    <div className="playtest-rating-grid">
                      <label>
                        Clarity
                        <select
                          aria-label="Checkpoint clarity"
                          onChange={(event) =>
                            setRatings((current) => ({
                              ...current,
                              clarity: event.target.value
                                ? (event.target.value as
                                    | 'clear'
                                    | 'confusing')
                                : undefined,
                            }))
                          }
                          value={ratings.clarity ?? ''}
                        >
                          <option value="">Not rated</option>
                          <option value="clear">Clear</option>
                          <option value="confusing">Confusing</option>
                        </select>
                      </label>
                      <label>
                        Enjoyment
                        <select
                          aria-label="Checkpoint enjoyment"
                          onChange={(event) =>
                            setRatings((current) => ({
                              ...current,
                              enjoyment: event.target.value
                                ? (event.target.value as
                                    | 'fun'
                                    | 'boring')
                                : undefined,
                            }))
                          }
                          value={ratings.enjoyment ?? ''}
                        >
                          <option value="">Not rated</option>
                          <option value="fun">Fun</option>
                          <option value="boring">Boring</option>
                        </select>
                      </label>
                      <label>
                        Fairness
                        <select
                          aria-label="Checkpoint fairness"
                          onChange={(event) =>
                            setRatings((current) => ({
                              ...current,
                              fairness: event.target.value
                                ? (event.target.value as
                                    | 'fair'
                                    | 'unfair')
                                : undefined,
                            }))
                          }
                          value={ratings.fairness ?? ''}
                        >
                          <option value="">Not rated</option>
                          <option value="fair">Fair</option>
                          <option value="unfair">Unfair</option>
                        </select>
                      </label>
                      <label>
                        Difficulty
                        <select
                          aria-label="Checkpoint difficulty"
                          onChange={(event) =>
                            setRatings((current) => ({
                              ...current,
                              difficulty: event.target.value
                                ? (event.target.value as
                                    | 'too-easy'
                                    | 'balanced'
                                    | 'too-hard')
                                : undefined,
                            }))
                          }
                          value={ratings.difficulty ?? ''}
                        >
                          <option value="">Not rated</option>
                          <option value="too-easy">Too easy</option>
                          <option value="balanced">Balanced</option>
                          <option value="too-hard">Too hard</option>
                        </select>
                      </label>
                      <label>
                        Pace
                        <select
                          aria-label="Checkpoint pace"
                          onChange={(event) =>
                            setRatings((current) => ({
                              ...current,
                              pace: event.target.value
                                ? (event.target.value as
                                    | 'too-slow'
                                    | 'balanced'
                                    | 'too-fast')
                                : undefined,
                            }))
                          }
                          value={ratings.pace ?? ''}
                        >
                          <option value="">Not rated</option>
                          <option value="too-slow">Too slow</option>
                          <option value="balanced">Balanced</option>
                          <option value="too-fast">Too fast</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      Optional short note
                      <textarea
                        maxLength={280}
                        onChange={(event) =>
                          setCheckpointNote(event.target.value)
                        }
                        placeholder="Please avoid names or contact details."
                        value={checkpointNote}
                      />
                    </label>
                    <div className="action-row">
                      <button
                        className="primary-btn"
                        onClick={() =>
                          submitCheckpoint(pendingCheckpoint)
                        }
                        type="button"
                      >
                        Save checkpoint locally
                      </button>
                      <button
                        className="secondary-btn"
                        onClick={() =>
                          controller.dismissCheckpoint(
                            pendingCheckpoint,
                          )
                        }
                        type="button"
                      >
                        Skip
                      </button>
                    </div>
                  </fieldset>
                ) : null}

                <fieldset className="playtest-section">
                  <legend>Quick feedback</legend>
                  <div className="playtest-note-grid">
                    <label>
                      Category
                      <select
                        aria-label="Playtest note category"
                        onChange={(event) =>
                          setQuickCategory(
                            event.target.value as PlaytestNoteCategory,
                          )
                        }
                        value={quickCategory}
                      >
                        {PLAYTEST_NOTE_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {NOTE_CATEGORY_LABELS[category]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Optional note
                      <textarea
                        aria-label="Playtest note"
                        maxLength={280}
                        onChange={(event) =>
                          setQuickNote(event.target.value)
                        }
                        placeholder="What happened? Please omit personal information."
                        value={quickNote}
                      />
                    </label>
                  </div>
                  <button
                    className="primary-btn"
                    data-testid="save-playtest-note"
                    onClick={submitQuickNote}
                    type="button"
                  >
                    Store note locally
                  </button>
                </fieldset>

                <details className="playtest-section">
                  <summary>Tester checklist</summary>
                  <p className="small-note">
                    This guides coverage without revealing solutions.
                  </p>
                  <div className="playtest-checklist">
                    {PLAYTEST_CHECKLIST_IDS.map((id, index) => (
                      <label key={id}>
                        <input
                          checked={session?.checklist[id] ?? false}
                          onChange={(event) =>
                            controller.markChecklist(
                              id,
                              event.target.checked,
                            )
                          }
                          type="checkbox"
                        />
                        {index + 1}. {CHECKLIST_LABELS[id]}
                      </label>
                    ))}
                  </div>
                </details>

                <details className="playtest-section">
                  <summary>Optional tester cohorts</summary>
                  <p className="small-note">
                    Select only labels you choose for yourself. Gym Buddies
                    never infers these labels.
                  </p>
                  <div className="playtest-cohort-grid">
                    {PLAYTEST_COHORT_IDS.map((cohort) => (
                      <label key={cohort}>
                        <input
                          checked={
                            session?.cohortLabels.includes(cohort) ??
                            false
                          }
                          onChange={() =>
                            controller.toggleCohort(cohort)
                          }
                          type="checkbox"
                        />
                        {COHORT_LABELS[cohort]}
                      </label>
                    ))}
                  </div>
                </details>

                <details className="playtest-section" open>
                  <summary>Report preview and export</summary>
                  <div
                    className="playtest-report-preview"
                    data-testid="playtest-report-preview"
                  >
                    <p>
                      The export includes session ID, game/build/schema
                      versions, duration, selected cohorts, milestone
                      ratings, counters, error summaries, and the current
                      progression summary.
                    </p>
                    <label>
                      <input
                        checked={includeEnvironment}
                        onChange={(event) =>
                          setIncludeEnvironment(event.target.checked)
                        }
                        type="checkbox"
                      />
                      Include coarse environment: browser/OS family,
                      viewport, touch and gamepad availability
                    </label>
                    <label>
                      <input
                        checked={includeTimeline}
                        onChange={(event) =>
                          setIncludeTimeline(event.target.checked)
                        }
                        type="checkbox"
                      />
                      Include bounded event timeline (
                      {session?.timeline.length ?? 0} events)
                    </label>
                    <p>
                      Player-created notes included:{' '}
                      {reportPreview?.session.feedback.length ?? 0}.
                      Errors included:{' '}
                      {reportPreview?.session.errors.length ?? 0}.
                    </p>
                    {session?.feedback.length ? (
                      <ul className="playtest-feedback-list">
                        {session.feedback.map((entry) => (
                          <li key={entry.id}>
                            <span>
                              {entry.category ??
                                entry.checkpointId ??
                                'feedback'}
                              {entry.note
                                ? ` — ${entry.note}`
                                : ' — no written note'}
                            </span>
                            <button
                              className="secondary-btn micro-btn"
                              onClick={() =>
                                controller.removeFeedback(entry.id)
                              }
                              type="button"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="action-row">
                      <button
                        className="primary-btn"
                        data-testid="export-playtest-report"
                        onClick={exportReport}
                        type="button"
                      >
                        Export JSON report
                      </button>
                      <button
                        className="secondary-btn"
                        onClick={() =>
                          controller.queueCheckpoint('session-end')
                        }
                        type="button"
                      >
                        End-session checkpoint
                      </button>
                    </div>
                  </div>
                </details>
              </>
            )}

            {status ? (
              <p aria-live="polite" className="playtest-status">
                {status}
              </p>
            ) : null}
          </section>
    </div>
  );
}
