import { TRAINER_PHYSIQUE_PRESETS } from '../../../game/content/trainerAppearance';
import type { TrainerForgeMode } from '../../../game/types';
import { BodyRegionMap } from './BodyRegionMap';
import type { TrainerBodyRegionId } from './studioConfig';

type BuildNavigatorProps = Readonly<{
  forgeMode: TrainerForgeMode;
  onModeChange: (mode: TrainerForgeMode) => void;
  onPresetSelect: (presetId: string) => void;
  onRegionSelect: (region: TrainerBodyRegionId) => void;
  selectedPresetId: string;
  selectedRegion: TrainerBodyRegionId;
}>;

export function BuildNavigator({
  forgeMode,
  onModeChange,
  onPresetSelect,
  onRegionSelect,
  selectedPresetId,
  selectedRegion,
}: BuildNavigatorProps) {
  return (
    <aside className="trainer-studio-build-nav" aria-label="Build and body-region navigator">
      <div className="trainer-forge-mode" aria-label="Trainer Forge mode">
        <button
          type="button"
          data-setup-control="true"
          aria-pressed={forgeMode === 'quick'}
          className={forgeMode === 'quick' ? 'active' : ''}
          onClick={() => onModeChange('quick')}
        >
          <strong>Quick Forge</strong>
          <small>Essential silhouette controls</small>
        </button>
        <button
          type="button"
          data-setup-control="true"
          aria-pressed={forgeMode === 'detail'}
          className={forgeMode === 'detail' ? 'active' : ''}
          onClick={() => onModeChange('detail')}
        >
          <strong>Detail Forge</strong>
          <small>Every regional proportion</small>
        </button>
      </div>

      <section className="trainer-studio-preset-rail" aria-label="Physique presets">
        <span className="trainer-studio-label">PHYSIQUE PRESETS</span>
        <div className="trainer-studio-preset-list">
          {TRAINER_PHYSIQUE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              data-setup-control="true"
              aria-pressed={selectedPresetId === preset.id}
              className={selectedPresetId === preset.id ? 'active' : ''}
              onClick={() => onPresetSelect(preset.id)}
              title={preset.description}
            >
              <span aria-hidden="true">{preset.label.slice(0, 2).toUpperCase()}</span>
              <strong>{preset.label}</strong>
            </button>
          ))}
        </div>
      </section>

      {forgeMode === 'detail' ? (
        <section className="trainer-studio-body-nav">
          <span className="trainer-studio-label">BODY REGION</span>
          <BodyRegionMap selectedRegion={selectedRegion} onSelect={onRegionSelect} />
        </section>
      ) : (
        <p className="trainer-quick-note">
          Ten major controls produce a strong silhouette quickly. Detail Forge keeps every current value.
        </p>
      )}
    </aside>
  );
}
