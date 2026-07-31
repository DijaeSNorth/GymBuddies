import { useMemo } from 'react';

import { createRepresentativeTestSaves } from '../../game/debug/representativeSaves';

export type RepresentativeSaveSelection = Readonly<{
  id: string;
  label: string;
  description: string;
  json: string;
}>;

type RepresentativeSaveToolsProps = Readonly<{
  onSelect: (entry: RepresentativeSaveSelection) => void;
}>;

export function RepresentativeSaveTools({
  onSelect,
}: RepresentativeSaveToolsProps) {
  const representativeSaves = useMemo(
    () => createRepresentativeTestSaves(),
    [],
  );
  return (
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
            onClick={() => onSelect(entry)}
            title={entry.description}
            type="button"
          >
            {entry.label}
          </button>
        ))}
      </div>
    </details>
  );
}
