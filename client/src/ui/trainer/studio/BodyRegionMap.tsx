import type { TrainerBodyRegionId } from './studioConfig';

type BodyRegionMapProps = Readonly<{
  onSelect: (region: TrainerBodyRegionId) => void;
  selectedRegion: TrainerBodyRegionId;
}>;

const FRONT_REGIONS: ReadonlyArray<{ id: TrainerBodyRegionId; label: string }> = [
  { id: 'head-neck', label: 'Head and neck' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'chest', label: 'Chest' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
  { id: 'quads', label: 'Quads' },
  { id: 'calves', label: 'Calves' },
];

const BACK_REGIONS: ReadonlyArray<{ id: TrainerBodyRegionId; label: string }> = [
  { id: 'back', label: 'Back' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'hands-feet', label: 'Hands and feet' },
  { id: 'overall', label: 'Overall physique' },
];

export function BodyRegionMap({ onSelect, selectedRegion }: BodyRegionMapProps) {
  const renderFigure = (
    label: string,
    regions: ReadonlyArray<{ id: TrainerBodyRegionId; label: string }>,
  ) => (
    <div className="trainer-body-map-figure" aria-label={`${label} body regions`}>
      <span aria-hidden="true" className="trainer-body-map-silhouette">
        <i className="head" /><i className="torso" /><i className="arm left" />
        <i className="arm right" /><i className="leg left" /><i className="leg right" />
      </span>
      <strong>{label}</strong>
      <div className="trainer-body-map-regions">
        {regions.map((region) => (
          <button
            key={region.id}
            type="button"
            data-setup-control="true"
            aria-pressed={selectedRegion === region.id}
            className={selectedRegion === region.id ? 'active' : ''}
            onClick={() => onSelect(region.id)}
          >
            {region.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="trainer-body-map">
      {renderFigure('Front', FRONT_REGIONS)}
      {renderFigure('Back', BACK_REGIONS)}
    </div>
  );
}
