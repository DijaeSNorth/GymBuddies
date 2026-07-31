import { useMemo, useRef, useState } from 'react';

import {
  PLAYTEST_REPORT_MAX_BYTES,
  validatePlaytestReportJson,
} from '../../game/playtest/playtestValidation';
import type {
  PlaytestFeedback,
  PlaytestReport,
} from '../../game/playtest/types';
import './playtestReportViewer.css';

function feedbackLabel(entry: PlaytestFeedback) {
  return (
    entry.category ??
    entry.checkpointId ??
    entry.source
  );
}

function normalizedIssueKey(entry: PlaytestFeedback) {
  const note = entry.note
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 64);
  return `${feedbackLabel(entry)}:${note || 'no-note'}`;
}

function buildIssueMarkdown(report: PlaytestReport) {
  const confusion = report.session.feedback.filter(
    (entry) =>
      entry.category === 'confusing' ||
      entry.ratings.clarity === 'confusing',
  );
  const difficulty = report.session.feedback.filter(
    (entry) =>
      entry.category === 'too-difficult' ||
      entry.category === 'too-easy' ||
      entry.ratings.difficulty === 'too-hard' ||
      entry.ratings.difficulty === 'too-easy',
  );
  const positive = report.session.feedback.filter(
    (entry) =>
      entry.category === 'liked' ||
      entry.ratings.enjoyment === 'fun',
  );
  const lines = [
    '# Gym Buddies alpha playtest summary',
    '',
    `- Version: ${report.session.gameVersion}`,
    `- Build: ${report.session.buildId}`,
    `- Session: ${report.session.sessionId}`,
    `- Duration: ${Math.round(report.session.activeDurationMs / 60_000)} minutes`,
    `- Platform: ${report.session.environment?.operatingSystemFamily ?? 'removed'} / ${report.session.environment?.browserFamily ?? 'removed'}`,
    `- Party: ${report.progression.partySize}`,
    `- Gym: ${report.progression.currentGym ?? 'none'}`,
    '',
    '## Highest-priority observations',
    '',
    ...report.session.errors.map(
      (error) =>
        `- [Crash] ${error.category}: ${error.safeMessage}`,
    ),
    ...confusion.map(
      (entry) =>
        `- [Confusing] ${feedbackLabel(entry)}${entry.note ? `: ${entry.note}` : ''}`,
    ),
    ...difficulty.map(
      (entry) =>
        `- [Difficulty] ${feedbackLabel(entry)}${entry.note ? `: ${entry.note}` : ''}`,
    ),
    '',
    '## Positive feedback',
    '',
    ...(positive.length
      ? positive.map(
          (entry) =>
            `- ${feedbackLabel(entry)}${entry.note ? `: ${entry.note}` : ''}`,
        )
      : ['- No positive feedback was recorded.']),
    '',
    '## Reproduction context',
    '',
    `- Trainer level: ${report.progression.trainerLevel}`,
    `- Active Buddy level: ${report.progression.activeBuddyLevel ?? 'none'}`,
    `- Fatigue: ${report.progression.fatigueRange}`,
    `- Tutorial step: ${report.progression.tutorialStep}`,
    `- Bosses completed: ${report.progression.completedBosses}`,
  ];
  return lines.join('\n');
}

function downloadMarkdown(report: PlaytestReport) {
  const blob = new Blob([buildIssueMarkdown(report)], {
    type: 'text/markdown',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gym-buddies-alpha-${report.session.sessionId}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export function PlaytestReportViewer() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [report, setReport] = useState<PlaytestReport | null>(null);
  const [message, setMessage] = useState(
    'Open a player-exported report. Files stay in this browser tab.',
  );
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [errorsOnly, setErrorsOnly] = useState(false);

  const filteredFeedback = useMemo(() => {
    if (!report) return [];
    if (feedbackFilter === 'all') return report.session.feedback;
    if (feedbackFilter === 'confusion') {
      return report.session.feedback.filter(
        (entry) =>
          entry.category === 'confusing' ||
          entry.ratings.clarity === 'confusing',
      );
    }
    if (feedbackFilter === 'difficulty') {
      return report.session.feedback.filter(
        (entry) =>
          entry.category === 'too-difficult' ||
          entry.category === 'too-easy' ||
          entry.ratings.difficulty === 'too-hard' ||
          entry.ratings.difficulty === 'too-easy',
      );
    }
    if (feedbackFilter === 'positive') {
      return report.session.feedback.filter(
        (entry) =>
          entry.category === 'liked' ||
          entry.ratings.enjoyment === 'fun',
      );
    }
    return report.session.feedback.filter(
      (entry) => entry.category === feedbackFilter,
    );
  }, [feedbackFilter, report]);

  const duplicateGroups = useMemo(() => {
    if (!report) return [];
    const groups = new Map<string, PlaytestFeedback[]>();
    report.session.feedback.forEach((entry) => {
      const key = normalizedIssueKey(entry);
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    });
    return [...groups.entries()]
      .map(([key, entries]) => ({ key, entries }))
      .sort((a, b) => b.entries.length - a.entries.length);
  }, [report]);

  async function openFile(file: File | null) {
    if (!file) return;
    if (file.size > PLAYTEST_REPORT_MAX_BYTES) {
      setMessage('Rejected: report exceeds the 512 KB limit.');
      setReport(null);
      return;
    }
    const validation = validatePlaytestReportJson(await file.text());
    if (!validation.ok) {
      setMessage(`Rejected: ${validation.message}`);
      setReport(null);
      return;
    }
    setReport(validation.report);
    setMessage('Validated playtest report opened locally.');
  }

  return (
    <main className="playtest-viewer">
      <header>
        <p className="trainer-kicker">Development-only diagnostic tool</p>
        <h1>Playtest Report Viewer</h1>
        <p>
          Review exported alpha sessions without uploading them. This
          surface is excluded from production builds.
        </p>
        <div className="action-row">
          <button
            className="primary-btn"
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            Open report JSON
          </button>
          <input
            accept="application/json,.json"
            hidden
            onChange={(event) =>
              void openFile(event.target.files?.[0] ?? null)
            }
            ref={fileRef}
            type="file"
          />
          {report ? (
            <button
              className="secondary-btn"
              onClick={() => downloadMarkdown(report)}
              type="button"
            >
              Export Markdown issue summary
            </button>
          ) : null}
        </div>
        <p aria-live="polite">{message}</p>
      </header>

      {report ? (
        <>
          <section className="viewer-grid" data-testid="report-summary">
            <article>
              <h2>Session summary</h2>
              <dl>
                <dt>Version / build</dt>
                <dd>
                  {report.session.gameVersion} / {report.session.buildId}
                </dd>
                <dt>Session</dt>
                <dd>{report.session.sessionId}</dd>
                <dt>Duration</dt>
                <dd>
                  {Math.round(
                    report.session.activeDurationMs / 60_000,
                  )}{' '}
                  minutes
                </dd>
                <dt>Environment</dt>
                <dd>
                  {report.session.environment
                    ? `${report.session.environment.operatingSystemFamily} / ${report.session.environment.browserFamily} / ${report.session.environment.touchAvailable ? 'touch' : 'non-touch'}`
                    : 'Removed by player'}
                </dd>
              </dl>
            </article>

            <article>
              <h2>Milestone funnel</h2>
              <ol>
                {report.session.completedCheckpoints.map(
                  (checkpoint) => (
                    <li key={checkpoint}>{checkpoint}</li>
                  ),
                )}
              </ol>
              <p>
                Pending: {report.session.pendingCheckpoints.join(', ') ||
                  'none'}
              </p>
            </article>

            <article>
              <h2>Attempt counters</h2>
              <dl>
                {Object.entries(report.session.counters).map(
                  ([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{value}</dd>
                    </div>
                  ),
                )}
              </dl>
            </article>

            <article>
              <h2>Mobile versus desktop</h2>
              <p>
                {report.session.environment
                  ? report.session.environment.touchAvailable ||
                    report.session.environment.operatingSystemFamily ===
                      'android' ||
                    report.session.environment.operatingSystemFamily ===
                      'ios'
                    ? 'Mobile/touch cohort signal'
                    : 'Desktop/non-touch cohort signal'
                  : 'Environment removed; use self-selected cohorts.'}
              </p>
              <p>
                Cohorts:{' '}
                {report.session.cohortLabels.join(', ') || 'none'}
              </p>
            </article>
          </section>

          <section className="viewer-panel">
            <div className="panel-head-row">
              <h2>Feedback review</h2>
              <label>
                Filter
                <select
                  onChange={(event) =>
                    setFeedbackFilter(event.target.value)
                  }
                  value={feedbackFilter}
                >
                  <option value="all">All</option>
                  <option value="confusion">Confusion points</option>
                  <option value="difficulty">Difficulty complaints</option>
                  <option value="positive">Positive feedback</option>
                  <option value="bug">Bugs</option>
                  <option value="performance-issue">Performance</option>
                  <option value="save-issue">Save issues</option>
                </select>
              </label>
            </div>
            <ul>
              {filteredFeedback.map((entry) => (
                <li key={entry.id}>
                  <strong>{feedbackLabel(entry)}</strong>
                  <span>{entry.note || 'No written note'}</span>
                  <small>
                    {entry.context.mode} ·{' '}
                    {entry.context.routeId ??
                      entry.context.gymId ??
                      'opening'}
                  </small>
                </li>
              ))}
            </ul>
          </section>

          <section className="viewer-panel">
            <div className="panel-head-row">
              <h2>Error review</h2>
              <label>
                <input
                  checked={errorsOnly}
                  onChange={(event) =>
                    setErrorsOnly(event.target.checked)
                  }
                  type="checkbox"
                />
                Hide timeline
              </label>
            </div>
            {report.session.errors.length ? (
              report.session.errors.map((error) => (
                <article key={error.id}>
                  <strong>{error.category}</strong>
                  <p>{error.safeMessage}</p>
                  <small>
                    {error.mode} · {error.locationId ?? 'no location'} ·{' '}
                    {error.overlay}
                  </small>
                </article>
              ))
            ) : (
              <p>No error summaries.</p>
            )}
          </section>

          {!errorsOnly ? (
            <section className="viewer-panel">
              <h2>Timeline</h2>
              <ol>
                {(report.session.timeline ?? []).map((event) => (
                  <li key={event.id}>
                    <strong>{event.kind}</strong> — {event.label}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <section className="viewer-panel">
            <h2>Duplicate-issue grouping</h2>
            <ul>
              {duplicateGroups.map((group) => (
                <li key={group.key}>
                  <strong>{group.entries.length}×</strong> {group.key}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </main>
  );
}
