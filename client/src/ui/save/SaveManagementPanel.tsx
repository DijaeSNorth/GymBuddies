import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createRepresentativeTestSaves } from '../../game/debug/representativeSaves';
import { SAVE_IMPORT_MAX_BYTES } from '../../game/content/save';
import { exportSaveJson } from '../../game/save/saveService';
import type { SaveData } from '../../game/types';

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

function downloadJson(save: SaveData) {
  const json = exportSaveJson(save);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `gym-buddies-save-v${save.schemaVersion}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

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
  const representativeSaves = useMemo(
    () =>
      import.meta.env.DEV ? createRepresentativeTestSaves() : [],
    [],
  );

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
                downloadJson(save);
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
        {representativeSaves.length > 0 ? (
          <details className="save-developer-tools">
            <summary>Developer Test Saves</summary>
            <p className="small-note">
              Development only. Every load still uses the normal migration,
              validation, and confirmation path.
            </p>
            <div className="action-row">
              {representativeSaves.map((entry) => (
                <button
                  className="secondary-btn micro-btn"
                  key={entry.id}
                  onClick={() =>
                    setPending({
                      kind: 'import',
                      label: entry.label,
                      json: entry.json,
                    })
                  }
                  title={entry.description}
                  type="button"
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </details>
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
