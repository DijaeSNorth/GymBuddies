import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react';

import { SAVE_IMPORT_MAX_BYTES } from '../../game/content/save';
import type { SaveData } from '../../game/types';
import { downloadSaveJson } from './saveDownload';

export type SaveUiActionResult = {
  ok: boolean;
  message: string;
};

interface SaveManagementPanelProps {
  canRestorePrevious: boolean;
  loadMessage: string;
  loadIssues: readonly string[];
  onImportJson: (text: string) => SaveUiActionResult;
  onRestorePrevious: () => SaveUiActionResult;
  save: SaveData;
}

type PendingAction =
  | {
      kind: 'import';
      label: string;
      json: string;
    }
  | {
      kind: 'restore';
      label: string;
    };

const LazyRepresentativeSaveTools = import.meta.env.DEV
  ? lazy(() =>
      import('../debug/RepresentativeSaveTools').then(
        ({ RepresentativeSaveTools }) => ({
          default: RepresentativeSaveTools,
        }),
      ),
    )
  : null;

export function SaveManagementPanel({
  canRestorePrevious,
  loadIssues,
  loadMessage,
  onImportJson,
  onRestorePrevious,
  save,
}: SaveManagementPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [status, setStatus] = useState(loadMessage);

  useEffect(() => {
    setStatus(loadMessage);
  }, [loadMessage]);

  useEffect(() => {
    if (!pending) return;
    const dialog = dialogRef.current;
    const controls = dialog
      ? Array.from(
          dialog.querySelectorAll<HTMLElement>('button:not([disabled])'),
        )
      : [];
    controls[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPending(null);
        return;
      }
      if (event.key !== 'Tab' || controls.length < 2) return;
      const current = controls.indexOf(
        document.activeElement as HTMLElement,
      );
      const next = event.shiftKey
        ? (current - 1 + controls.length) % controls.length
        : (current + 1) % controls.length;
      event.preventDefault();
      controls[next]?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pending]);

  const confirmPending = () => {
    if (!pending) return;
    const result =
      pending.kind === 'import'
        ? onImportJson(pending.json)
        : onRestorePrevious();
    setStatus(result.message);
    if (result.ok) setPending(null);
  };

  const selectFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > SAVE_IMPORT_MAX_BYTES) {
        setStatus(
          'That file is larger than the 1 MiB save import limit. The current journey was not changed.',
        );
        return;
      }
      const json = await file.text();
      setPending({
        kind: 'import',
        label: file.name,
        json,
      });
    } catch {
      setStatus('The selected save file could not be read.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <details className="save-management">
      <summary>Save Management</summary>
      <div className="save-management-body">
        <div className="action-row">
          <button
            className="secondary-btn micro-btn"
            onClick={() => {
              try {
                downloadSaveJson(
                  save,
                  `gym-buddies-save-v${save.schemaVersion}.json`,
                );
                setStatus('Exported the current schema-14 save.');
              } catch (error) {
                setStatus(
                  error instanceof Error
                    ? error.message
                    : 'Save export failed.',
                );
              }
            }}
            type="button"
          >
            Export JSON
          </button>
          <button
            className="secondary-btn micro-btn"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            Import JSON
          </button>
          <button
            className="secondary-btn micro-btn"
            disabled={!canRestorePrevious}
            onClick={() =>
              setPending({
                kind: 'restore',
                label: 'previous local save',
              })
            }
            type="button"
          >
            Restore Previous
          </button>
          <input
            accept="application/json,.json"
            aria-label="Choose Gym Buddies save JSON"
            className="visually-hidden"
            onChange={(event) =>
              void selectFile(event.target.files?.[0])
            }
            ref={fileInputRef}
            type="file"
          />
        </div>
        <p aria-live="polite" className="small-note">
          Schema {save.schemaVersion}: {status}
        </p>
        {loadIssues.length > 0 ? (
          <details className="save-recovery-details">
            <summary>Recovery details ({loadIssues.length})</summary>
            <ul>
              {loadIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </details>
        ) : null}
        {LazyRepresentativeSaveTools ? (
          <Suspense fallback={null}>
            <LazyRepresentativeSaveTools
              onSelect={(entry) =>
                setPending({
                  kind: 'import',
                  label: entry.label,
                  json: entry.json,
                })
              }
            />
          </Suspense>
        ) : null}
      </div>

      {pending ? (
        <div className="trainer-dialog-backdrop">
          <section
            aria-describedby="save-replace-description"
            aria-labelledby="save-replace-title"
            aria-modal="true"
            className="trainer-restart-dialog"
            ref={dialogRef}
            role="dialog"
          >
            <p className="trainer-kicker">Save replacement confirmation</p>
            <h2 id="save-replace-title">
              {pending.kind === 'import'
                ? 'Import this journey?'
                : 'Restore the previous journey?'}
            </h2>
            <p id="save-replace-description">
              Applying <strong>{pending.label}</strong> replaces the current
              in-game journey. The current valid save is retained as the
              previous-save backup.
            </p>
            <div className="action-row">
              <button
                autoFocus
                className="secondary-btn"
                onClick={() => setPending(null)}
                type="button"
              >
                Keep Current Journey
              </button>
              <button
                className="trainer-confirm-reset"
                onClick={confirmPending}
                type="button"
              >
                {pending.kind === 'import'
                  ? 'Validate & Import'
                  : 'Restore Previous Save'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </details>
  );
}
