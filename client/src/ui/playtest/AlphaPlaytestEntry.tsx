import { lazy, Suspense, useState } from 'react';

import type { PlaytestCheckpointId } from '../../game/playtest/types';
import type { AlphaPlaytestController } from './useAlphaPlaytest';
import './alphaPlaytestEntry.css';

const LazyAlphaPlaytestPanel = lazy(() =>
  import('./AlphaPlaytestPanel').then(({ AlphaPlaytestPanel }) => ({
    default: AlphaPlaytestPanel,
  })),
);

const CHECKPOINT_LABELS: Record<PlaytestCheckpointId, string> = {
  'trainer-created': 'How clear was trainer creation?',
  'first-workout': 'How did the first workout feel?',
  'first-route': 'Was reaching the first route clear?',
  'first-encounter': 'Was the first encounter understandable?',
  'first-capture-success': 'How did the successful capture feel?',
  'first-capture-failure': 'Did the failed capture feel fair?',
  'first-boss': 'Were the boss requirements understandable?',
  'twenty-minutes': 'How has the pace felt after 20 minutes?',
  'session-end': 'How did this session feel overall?',
};

type AlphaPlaytestEntryProps = Readonly<{
  controller: AlphaPlaytestController;
  saveSchemaVersion: number;
}>;

export function AlphaPlaytestEntry({
  controller,
  saveSchemaVersion,
}: AlphaPlaytestEntryProps) {
  const [open, setOpen] = useState(false);
  const pendingCheckpoint =
    controller.enabled && controller.safeForCheckpoint
      ? controller.session?.pendingCheckpoints[0] ?? null
      : null;

  return (
    <>
      <button
        className="playtest-note-launcher"
        data-testid="playtest-note-launcher"
        onClick={() => setOpen(true)}
        type="button"
      >
        {controller.enabled ? 'Playtest Note' : 'Alpha Playtest'}
      </button>

      {pendingCheckpoint && !open ? (
        <aside
          aria-label="Optional playtest checkpoint"
          className="playtest-checkpoint-toast"
        >
          <strong>Optional checkpoint</strong>
          <span>{CHECKPOINT_LABELS[pendingCheckpoint]}</span>
          <div className="action-row">
            <button
              className="primary-btn micro-btn"
              onClick={() => setOpen(true)}
              type="button"
            >
              Share feedback
            </button>
            <button
              className="secondary-btn micro-btn"
              onClick={() =>
                controller.dismissCheckpoint(pendingCheckpoint)
              }
              type="button"
            >
              Skip
            </button>
          </div>
        </aside>
      ) : null}

      {open ? (
        <Suspense
          fallback={
            <div
              aria-live="polite"
              className="playtest-panel-loading"
              role="status"
            >
              Preparing local playtest tools…
            </div>
          }
        >
          <LazyAlphaPlaytestPanel
            controller={controller}
            onClose={() => setOpen(false)}
            saveSchemaVersion={saveSchemaVersion}
          />
        </Suspense>
      ) : null}
    </>
  );
}
