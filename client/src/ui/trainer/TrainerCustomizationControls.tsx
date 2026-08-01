import type { CSSProperties, ReactNode } from 'react';

import {
  DEFAULT_TRAINER_APPEARANCE,
  TRAINER_APPEARANCE_OPTION_GROUPS,
  TRAINER_BUILD_ATTRIBUTES,
  TRAINER_BUILD_MAX,
  TRAINER_BUILD_MIN,
  TRAINER_COLOR_OPTIONS,
  TRAINER_PHYSIQUE_PRESETS,
  TRAINER_SKIN_TONES,
} from '../../game/content/trainerAppearance';
import {
  MAX_MUSCLE_LEVEL,
  TRAINER_BODY_PRESETS,
  TRAINER_MUSCLES,
} from '../../game/content/trainer';
import { updateTrainerBuildValue } from '../../game/systems/trainerAppearance';
import type {
  TrainerAppearance,
  TrainerAppearanceCategory,
  TrainerAppearanceOption,
  TrainerBuildAttributeId,
  TrainerColorOption,
  TrainerCreationDraft,
  TrainerMuscleId,
} from '../../game/types';

export const TRAINER_CUSTOMIZATION_TABS: Array<{
  id: TrainerAppearanceCategory;
  label: string;
  detailOnly?: boolean;
}> = [
  { id: 'build', label: 'Build' },
  { id: 'upper-body', label: 'Upper Body', detailOnly: true },
  { id: 'core', label: 'Core', detailOnly: true },
  { id: 'lower-body', label: 'Lower Body', detailOnly: true },
  { id: 'face', label: 'Face' },
  { id: 'hair', label: 'Hair' },
  { id: 'outfit', label: 'Outfit' },
  { id: 'colors', label: 'Colors' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'poses', label: 'Poses' },
  { id: 'saved-looks', label: 'Saved Looks' },
];

function cosmeticBuildBand(value: number) {
  if (value <= 3) return 'Athletic';
  if (value <= 7) return 'Developed';
  return 'Showcase';
}

function OptionSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: readonly TrainerAppearanceOption[];
  value: string;
}) {
  return (
    <label className="trainer-option-field">
      <span>{label}</span>
      <select
        data-setup-control="true"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorPicker({
  label,
  onChange,
  options = TRAINER_COLOR_OPTIONS,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options?: readonly TrainerColorOption[];
  value: string;
}) {
  const selected = options.find((option) => option.id === value) ?? options[0]!;
  return (
    <fieldset className="trainer-palette-picker">
      <legend>{label}</legend>
      <div className="trainer-palette-heading">
        <span
          aria-hidden="true"
          className="trainer-current-color"
          style={{ '--swatch': selected.hex } as CSSProperties}
        />
        <strong>{selected.label}</strong>
      </div>
      <div className="trainer-curated-swatches">
        {options.map((option) => (
          <button
            aria-label={`${label}: ${option.label}`}
            aria-pressed={option.id === value}
            className={option.id === value ? 'active' : ''}
            data-setup-control="true"
            key={option.id}
            onClick={() => onChange(option.id)}
            style={{ '--swatch': option.hex } as CSSProperties}
            title={option.label}
            type="button"
          />
        ))}
      </div>
    </fieldset>
  );
}

function BuildControls({
  appearance,
  attributeIds,
  groupLabel,
  onAppearanceChange,
  onPhysiquePresetSelect,
  showPhysiquePresets,
}: {
  appearance: TrainerAppearance;
  attributeIds: readonly TrainerBuildAttributeId[];
  groupLabel: string;
  onAppearanceChange: (appearance: TrainerAppearance) => void;
  onPhysiquePresetSelect: (presetId: string) => void;
  showPhysiquePresets: boolean;
}) {
  const changeBuild = (key: TrainerBuildAttributeId, value: number) => {
    onAppearanceChange(updateTrainerBuildValue(appearance, key, value));
  };
  const attributeSet = new Set(attributeIds);
  const visibleBuildAttributes = TRAINER_BUILD_ATTRIBUTES.filter((attribute) =>
    attributeSet.has(attribute.id),
  );
  return (
    <div className="trainer-tab-stack">
      <details className="trainer-custom-section trainer-control-group" open>
        <summary>{groupLabel}</summary>
        <div className="trainer-custom-copy">
          <h3>{groupLabel}</h3>
          <p>
            These are stylized RPG appearance controls, not health or medical
            measurements. Cosmetic settings never change combat power.
          </p>
        </div>
        {showPhysiquePresets ? (
          <div className="trainer-physique-presets">
            {TRAINER_PHYSIQUE_PRESETS.map((preset) => (
              <button
                data-setup-control="true"
                key={preset.id}
                onClick={() => onPhysiquePresetSelect(preset.id)}
                type="button"
              >
                <strong>{preset.label}</strong>
                <small>{preset.description}</small>
              </button>
            ))}
          </div>
        ) : null}
        <div className="trainer-build-controls">
          {visibleBuildAttributes.map((attribute) => {
            const value = appearance.build[attribute.id];
            return (
              <div className="trainer-build-control" key={attribute.id}>
                <div>
                  <label htmlFor={`trainer-build-${attribute.id}`}>
                    {attribute.label}
                  </label>
                  <small>{attribute.detail}</small>
                </div>
                <div className="trainer-build-input">
                  <button
                    aria-label={`Decrease cosmetic ${attribute.label}`}
                    data-setup-control="true"
                    onClick={() => changeBuild(attribute.id, value - 1)}
                    type="button"
                  >
                    −
                  </button>
                  <input
                    aria-valuetext={`${value}: ${attribute.minimumLabel} to ${attribute.maximumLabel}`}
                    data-setup-control="true"
                    id={`trainer-build-${attribute.id}`}
                    max={TRAINER_BUILD_MAX}
                    min={TRAINER_BUILD_MIN}
                    onChange={(event) =>
                      changeBuild(attribute.id, Number(event.target.value))
                    }
                    type="range"
                    value={value}
                  />
                  <output htmlFor={`trainer-build-${attribute.id}`}>
                    {value} · {cosmeticBuildBand(value)}
                  </output>
                  <button
                    aria-label={`Reset cosmetic ${attribute.label}`}
                    data-setup-control="true"
                    onClick={() =>
                      changeBuild(
                        attribute.id,
                        DEFAULT_TRAINER_APPEARANCE.build[attribute.id],
                      )
                    }
                    title={`Reset ${attribute.label}`}
                    type="button"
                  >
                    R
                  </button>
                  <button
                    aria-label={`Increase cosmetic ${attribute.label}`}
                    data-setup-control="true"
                    onClick={() => changeBuild(attribute.id, value + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

export function GameplayAttributesPanel({
  draft,
  onGameplayPresetSelect,
  onMuscleChange,
}: {
  draft: TrainerCreationDraft;
  onGameplayPresetSelect: (presetId: string) => void;
  onMuscleChange: (key: TrainerMuscleId, value: number) => void;
}) {
  return (
    <details className="trainer-custom-section trainer-gameplay-stat-section trainer-control-group" open>
        <summary>Separate gameplay attributes</summary>
        <div className="trainer-custom-copy">
          <p className="trainer-separation-label">Separate progression data</p>
          <h3>Fictional gameplay attributes</h3>
          <p>
            These statistics affect Gym Buddies systems. They do not change
            your visible body unless you deliberately choose matching cosmetic
            proportions.
          </p>
        </div>
        <div className="trainer-gameplay-presets">
          {TRAINER_BODY_PRESETS.map((preset) => (
            <button
              className={draft.bodyPresetId === preset.id ? 'active' : ''}
              data-setup-control="true"
              key={preset.id}
              onClick={() => onGameplayPresetSelect(preset.id)}
              type="button"
            >
              <strong>{preset.label}</strong>
              <small>{preset.description}</small>
            </button>
          ))}
        </div>
        <div className="trainer-gameplay-attributes">
          {TRAINER_MUSCLES.map((attribute) => {
            const value = draft.muscles[attribute.id];
            return (
              <div className="trainer-gameplay-attribute" key={attribute.id}>
                <div>
                  <label htmlFor={`trainer-stat-${attribute.id}`}>
                    {attribute.label}
                  </label>
                  <small>{attribute.detail}</small>
                </div>
                <div className="trainer-build-input">
                  <button
                    aria-label={`Decrease gameplay ${attribute.label}`}
                    data-setup-control="true"
                    onClick={() => onMuscleChange(attribute.id, value - 1)}
                    type="button"
                  >
                    −
                  </button>
                  <input
                    data-setup-control="true"
                    id={`trainer-stat-${attribute.id}`}
                    max={MAX_MUSCLE_LEVEL}
                    min={0}
                    onChange={(event) =>
                      onMuscleChange(attribute.id, Number(event.target.value))
                    }
                    type="range"
                    value={value}
                  />
                  <output htmlFor={`trainer-stat-${attribute.id}`}>
                    {value}
                  </output>
                  <button
                    aria-label={`Increase gameplay ${attribute.label}`}
                    data-setup-control="true"
                    onClick={() => onMuscleChange(attribute.id, value + 1)}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
    </details>
  );
}

function FaceControls({
  appearance,
  onAppearanceChange,
}: {
  appearance: TrainerAppearance;
  onAppearanceChange: (appearance: TrainerAppearance) => void;
}) {
  const set = (
    key: keyof TrainerAppearance['face'],
    value: string,
  ) =>
    onAppearanceChange({
      ...appearance,
      face: { ...appearance.face, [key]: value },
    });
  return (
    <div className="trainer-option-grid">
      <OptionSelect label="Face shape" onChange={(value) => set('shapeId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.faceShapes} value={appearance.face.shapeId} />
      <OptionSelect label="Eyes" onChange={(value) => set('eyesId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.eyes} value={appearance.face.eyesId} />
      <OptionSelect label="Eyebrows" onChange={(value) => set('eyebrowsId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.eyebrows} value={appearance.face.eyebrowsId} />
      <OptionSelect label="Nose" onChange={(value) => set('noseId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.noses} value={appearance.face.noseId} />
      <OptionSelect label="Mouth" onChange={(value) => set('mouthId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.mouths} value={appearance.face.mouthId} />
      <OptionSelect label="Ears" onChange={(value) => set('earsId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.ears} value={appearance.face.earsId} />
      <OptionSelect label="Facial hair" onChange={(value) => set('facialHairId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.facialHair} value={appearance.face.facialHairId} />
      <OptionSelect label="Scars" onChange={(value) => set('scarId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.scars} value={appearance.face.scarId} />
      <OptionSelect label="Freckles" onChange={(value) => set('frecklesId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.freckles} value={appearance.face.frecklesId} />
      <OptionSelect label="Tattoos" onChange={(value) => set('tattooId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.tattoos} value={appearance.face.tattooId} />
      <OptionSelect label="Face paint" onChange={(value) => set('facePaintId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.facePaint} value={appearance.face.facePaintId} />
    </div>
  );
}

function HairControls({
  appearance,
  onAppearanceChange,
}: {
  appearance: TrainerAppearance;
  onAppearanceChange: (appearance: TrainerAppearance) => void;
}) {
  const set = (
    key: keyof TrainerAppearance['hair'],
    value: string,
  ) => {
    const hair = { ...appearance.hair, [key]: value };
    if (key === 'styleId' && value === 'bald') hair.lengthId = 'none';
    onAppearanceChange({ ...appearance, hair });
  };
  return (
    <div className="trainer-tab-stack">
      <div className="trainer-option-grid">
        <OptionSelect label="Hair style" onChange={(value) => set('styleId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.hairStyles} value={appearance.hair.styleId} />
        <OptionSelect label="Hair length" onChange={(value) => set('lengthId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.hairLengths} value={appearance.hair.lengthId} />
      </div>
      <div className="trainer-color-picker-grid">
        <ColorPicker label="Hair color" onChange={(value) => set('colorId', value)} value={appearance.hair.colorId} />
        <ColorPicker label="Highlight color" onChange={(value) => set('highlightColorId', value)} value={appearance.hair.highlightColorId} />
      </div>
    </div>
  );
}

function OutfitControls({
  appearance,
  onAppearanceChange,
}: {
  appearance: TrainerAppearance;
  onAppearanceChange: (appearance: TrainerAppearance) => void;
}) {
  const set = (
    key: keyof TrainerAppearance['outfit'],
    value: string,
  ) =>
    onAppearanceChange({
      ...appearance,
      outfit: { ...appearance.outfit, [key]: value },
    });
  return (
    <div className="trainer-option-grid">
      <OptionSelect label="Top" onChange={(value) => set('topId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.tops} value={appearance.outfit.topId} />
      <OptionSelect label="Bottoms" onChange={(value) => set('bottomsId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.bottoms} value={appearance.outfit.bottomsId} />
      <OptionSelect label="Shoes" onChange={(value) => set('shoesId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.shoes} value={appearance.outfit.shoesId} />
      <OptionSelect label="Socks" onChange={(value) => set('socksId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.socks} value={appearance.outfit.socksId} />
      <OptionSelect label="Gloves" onChange={(value) => set('glovesId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.gloves} value={appearance.outfit.glovesId} />
      <OptionSelect label="Wrist wraps" onChange={(value) => set('wristWrapsId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.wristWraps} value={appearance.outfit.wristWrapsId} />
      <OptionSelect label="Elbow sleeves" onChange={(value) => set('elbowSleevesId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.elbowSleeves} value={appearance.outfit.elbowSleevesId} />
      <OptionSelect label="Knee sleeves" onChange={(value) => set('kneeSleevesId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.kneeSleeves} value={appearance.outfit.kneeSleevesId} />
      <OptionSelect label="Original logo shape" onChange={(value) => set('logoShapeId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.logoShapes} value={appearance.outfit.logoShapeId} />
      <OptionSelect label="Chalk marks" onChange={(value) => set('chalkMarksId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.chalkMarks} value={appearance.outfit.chalkMarksId} />
    </div>
  );
}

function ColorControls({
  appearance,
  onAppearanceChange,
}: {
  appearance: TrainerAppearance;
  onAppearanceChange: (appearance: TrainerAppearance) => void;
}) {
  const set = (
    key: keyof TrainerAppearance['colors'],
    value: string,
  ) =>
    onAppearanceChange({
      ...appearance,
      colors: { ...appearance.colors, [key]: value },
    });
  return (
    <div className="trainer-color-picker-grid">
      <ColorPicker label="Skin tone" onChange={(value) => set('skinToneId', value)} options={TRAINER_SKIN_TONES} value={appearance.colors.skinToneId} />
      <ColorPicker label="Top primary" onChange={(value) => set('topPrimaryId', value)} value={appearance.colors.topPrimaryId} />
      <ColorPicker label="Top secondary" onChange={(value) => set('topSecondaryId', value)} value={appearance.colors.topSecondaryId} />
      <ColorPicker label="Top accent" onChange={(value) => set('topAccentId', value)} value={appearance.colors.topAccentId} />
      <ColorPicker label="Bottom primary" onChange={(value) => set('bottomPrimaryId', value)} value={appearance.colors.bottomPrimaryId} />
      <ColorPicker label="Bottom secondary" onChange={(value) => set('bottomSecondaryId', value)} value={appearance.colors.bottomSecondaryId} />
      <ColorPicker label="Shoe primary" onChange={(value) => set('shoePrimaryId', value)} value={appearance.colors.shoePrimaryId} />
      <ColorPicker label="Shoe accent" onChange={(value) => set('shoeAccentId', value)} value={appearance.colors.shoeAccentId} />
      <ColorPicker label="Accessory primary" onChange={(value) => set('accessoryPrimaryId', value)} value={appearance.colors.accessoryPrimaryId} />
      <ColorPicker label="Accessory accent" onChange={(value) => set('accessoryAccentId', value)} value={appearance.colors.accessoryAccentId} />
      <ColorPicker label="Clothing trim" onChange={(value) => set('trimColorId', value)} value={appearance.colors.trimColorId} />
      <ColorPicker label="Fictional logo" onChange={(value) => set('logoColorId', value)} value={appearance.colors.logoColorId} />
    </div>
  );
}

function AccessoryControls({
  appearance,
  onAppearanceChange,
}: {
  appearance: TrainerAppearance;
  onAppearanceChange: (appearance: TrainerAppearance) => void;
}) {
  const set = (
    key: keyof TrainerAppearance['accessories'],
    value: string,
  ) =>
    onAppearanceChange({
      ...appearance,
      accessories: { ...appearance.accessories, [key]: value },
    });
  return (
    <div className="trainer-option-grid">
      <OptionSelect label="Headband or hat" onChange={(value) => set('headwearId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.headwear} value={appearance.accessories.headwearId} />
      <OptionSelect label="Belt" onChange={(value) => set('beltId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.belts} value={appearance.accessories.beltId} />
      <OptionSelect label="Gym bag" onChange={(value) => set('gymBagId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.gymBags} value={appearance.accessories.gymBagId} />
      <OptionSelect label="Jewelry" onChange={(value) => set('jewelryId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.jewelry} value={appearance.accessories.jewelryId} />
      <OptionSelect label="Gym towel" onChange={(value) => set('towelId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.towels} value={appearance.accessories.towelId} />
      <OptionSelect label="Late-game fantasy accessory" onChange={(value) => set('fantasyId', value)} options={TRAINER_APPEARANCE_OPTION_GROUPS.fantasy} value={appearance.accessories.fantasyId} />
    </div>
  );
}

export function TrainerCustomizationControls({
  activeTab,
  buildAttributeIds,
  buildGroupLabel,
  draft,
  onAppearanceChange,
  onPhysiquePresetSelect,
  poseContent,
  savedLooksContent,
  showPhysiquePresets = false,
}: {
  activeTab: TrainerAppearanceCategory;
  buildAttributeIds?: readonly TrainerBuildAttributeId[];
  buildGroupLabel?: string;
  draft: TrainerCreationDraft;
  onAppearanceChange: (appearance: TrainerAppearance) => void;
  onPhysiquePresetSelect: (presetId: string) => void;
  poseContent: ReactNode;
  savedLooksContent: ReactNode;
  showPhysiquePresets?: boolean;
}) {
  if (
    activeTab === 'build' ||
    activeTab === 'upper-body' ||
    activeTab === 'core' ||
    activeTab === 'lower-body'
  ) {
    return (
      <BuildControls
        appearance={draft.appearance}
        attributeIds={
          buildAttributeIds ??
          TRAINER_BUILD_ATTRIBUTES.filter((attribute) =>
            activeTab === 'build'
              ? attribute.quick
              : attribute.region === activeTab,
          ).map((attribute) => attribute.id)
        }
        groupLabel={buildGroupLabel ?? 'Build controls'}
        onAppearanceChange={onAppearanceChange}
        onPhysiquePresetSelect={onPhysiquePresetSelect}
        showPhysiquePresets={showPhysiquePresets}
      />
    );
  }
  if (activeTab === 'face') {
    return <FaceControls appearance={draft.appearance} onAppearanceChange={onAppearanceChange} />;
  }
  if (activeTab === 'hair') {
    return <HairControls appearance={draft.appearance} onAppearanceChange={onAppearanceChange} />;
  }
  if (activeTab === 'outfit') {
    return <OutfitControls appearance={draft.appearance} onAppearanceChange={onAppearanceChange} />;
  }
  if (activeTab === 'colors') {
    return <ColorControls appearance={draft.appearance} onAppearanceChange={onAppearanceChange} />;
  }
  if (activeTab === 'accessories') {
    return <AccessoryControls appearance={draft.appearance} onAppearanceChange={onAppearanceChange} />;
  }
  if (activeTab === 'poses') return <>{poseContent}</>;
  return <>{savedLooksContent}</>;
}
