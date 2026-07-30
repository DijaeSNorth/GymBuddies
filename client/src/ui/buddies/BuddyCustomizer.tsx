import { useMemo, useState } from 'react';

import {
  BUDDY_BODY_SIZE_OPTIONS,
  BUDDY_DEFINITION_OPTIONS,
  BUDDY_EMPHASIS_OPTIONS,
  BUDDY_MASS_OPTIONS,
  BUDDY_PALETTE_COLORS,
  BUDDY_POSE_OPTIONS,
  BUDDY_POSTURE_OPTIONS,
  BUDDY_PUMP_OPTIONS,
  BUDDY_STANCE_OPTIONS,
  BUDDY_SYMMETRY_OPTIONS,
  getBuddyCharacterDesign,
} from '../../game/content/buddyCharacters';
import {
  normalizeBuddyCosmetics,
  randomizeBuddyCosmetics,
} from '../../game/systems/buddyCosmetics';
import { createRuntimeSeed } from '../../game/systems/random';
import type {
  Buddy,
  BuddyCosmetics,
  BuddyFacingDirection,
  BuddyPose,
  BuddyPhysiqueRegion,
  BuddyPhysiqueSettings,
  BuddyVisualOption,
} from '../../game/types';
import type { BuddyShowcasePose } from '../../game/assets/types';
import { BuddySprite } from './BuddySprite';

type BuddyCustomizerProps = {
  buddy: Buddy;
  onChange: (buddy: Buddy) => void;
  onClose: () => void;
  reducedMotion: boolean;
};

const DIRECTIONS: BuddyFacingDirection[] = [
  'front',
  'right',
  'back',
  'left',
];

function showcasePoseFor(
  direction: BuddyFacingDirection,
  pose: BuddyPose,
): BuddyShowcasePose {
  if (pose === 'victory') return 'victory-pose';
  if (pose === 'fatigue') return 'fatigue-pose';
  if (pose === 'front-flex') return 'front-double-biceps';
  if (pose === 'back-flex') return 'back-double-biceps';
  if (pose === 'side-pose') return 'side-chest';
  if (direction === 'back') return 'back-relaxed';
  if (direction === 'left' || direction === 'right') return 'side-chest';
  return 'front-relaxed';
}
function OptionSelect({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: readonly BuddyVisualOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
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

export function BuddyCustomizer({
  buddy,
  onChange,
  onClose,
  reducedMotion,
}: BuddyCustomizerProps) {
  const design = useMemo(
    () => getBuddyCharacterDesign(buddy.creature.id),
    [buddy.creature.id],
  );
  const cosmetics = normalizeBuddyCosmetics(
    buddy.creature.id,
    buddy.cosmetics,
  );
  const [directionIndex, setDirectionIndex] = useState(0);
  const [pose, setPose] = useState<BuddyPose>('idle');

  function updateCosmetics(patch: Partial<BuddyCosmetics>) {
    onChange({
      ...buddy,
      cosmetics: normalizeBuddyCosmetics(buddy.creature.id, {
        ...cosmetics,
        ...patch,
      }),
    });
  }

  function toggleAccessory(id: string) {
    const current = cosmetics.accessoryIds.filter(
      (entry) => entry !== 'accessory-none',
    );
    const selectedOption = design.accessoryOptions.find(
      (entry) => entry.id === id,
    );
    const withoutSameSlot = selectedOption?.slot
      ? current.filter((entry) => {
          const option = design.accessoryOptions.find(
            (candidate) => candidate.id === entry,
          );
          return option?.slot !== selectedOption.slot;
        })
      : current;
    const next = current.includes(id)
      ? current.filter((entry) => entry !== id)
      : [...withoutSameSlot, id].slice(-4);
    updateCosmetics({
      accessoryIds: next.length > 0 ? next : ['accessory-none'],
    });
  }

  function updatePhysique(
    patch: Partial<BuddyPhysiqueSettings>,
  ) {
    updateCosmetics({
      physiquePresetId: cosmetics.physiquePresetId,
      physique: {
        ...cosmetics.physique,
        ...patch,
      },
    });
  }

  function applyPhysiquePreset(id: string) {
    const preset = design.physiquePresets.find((entry) => entry.id === id);
    if (!preset) return;
    updateCosmetics({
      physiquePresetId: preset.id,
      bodySizeId: preset.bodySizeId,
      muscleDefinitionId: preset.muscleDefinitionId,
      physique: { ...preset.physique },
    });
  }

  const physiqueFieldByRegion = {
    shoulders: 'shoulderEmphasisId',
    chest: 'chestEmphasisId',
    back: 'backEmphasisId',
    arms: 'armEmphasisId',
    core: 'coreEmphasisId',
    legs: 'legEmphasisId',
  } as const satisfies Record<BuddyPhysiqueRegion, keyof BuddyPhysiqueSettings>;

  function randomize() {
    const result = randomizeBuddyCosmetics(
      buddy.creature,
      createRuntimeSeed(),
    );
    onChange({ ...buddy, cosmetics: result.cosmetics });
  }

  return (
    <section
      aria-labelledby="buddy-customizer-title"
      className="buddy-customizer"
    >
      <div className="buddy-customizer-heading">
        <div>
          <span className="eyebrow">Cosmetic profile · no stat changes</span>
          <h4 id="buddy-customizer-title">
            Customize {buddy.nickname}
          </h4>
          <p>
            {design.buildLabel} · {design.trainingSpecialization}
          </p>
        </div>
        <button className="secondary-btn" onClick={onClose} type="button">
          Done
        </button>
      </div>

      <div className="buddy-customizer-layout">
        <div className="buddy-customizer-preview">
          <BuddySprite
            animated
            cosmetics={cosmetics}
            creature={buddy.creature}
            direction={DIRECTIONS[directionIndex]}
            label={`${buddy.nickname} customization preview`}
            pose={pose}
            presentationContext="showcase"
            reducedMotion={reducedMotion}
            scale={2}
            showcasePose={showcasePoseFor(
              DIRECTIONS[directionIndex]!,
              pose,
            )}
          />
          <div className="buddy-preview-controls">
            <button
              aria-label="Rotate Buddy left"
              onClick={() =>
                setDirectionIndex(
                  (index) => (index - 1 + DIRECTIONS.length) % DIRECTIONS.length,
                )
              }
              type="button"
            >
              ◀
            </button>
            <span>{DIRECTIONS[directionIndex]}</span>
            <button
              aria-label="Rotate Buddy right"
              onClick={() =>
                setDirectionIndex((index) => (index + 1) % DIRECTIONS.length)
              }
              type="button"
            >
              ▶
            </button>
          </div>
          <button className="secondary-btn" onClick={randomize} type="button">
            Randomize valid look
          </button>
        </div>

        <div className="buddy-customizer-controls">
          <label htmlFor="buddy-nickname">
            <span>Nickname</span>
            <input
              id="buddy-nickname"
              maxLength={24}
              onChange={(event) =>
                onChange({
                  ...buddy,
                  nickname: event.target.value.slice(0, 24),
                  cosmetics,
                })
              }
              value={buddy.nickname}
            />
          </label>

          <div className="buddy-customizer-grid">
            <OptionSelect
              id="buddy-physique-preset"
              label="Species build preset"
              options={design.physiquePresets}
              value={cosmetics.physiquePresetId}
              onChange={applyPhysiquePreset}
            />
            <OptionSelect
              id="buddy-primary-palette"
              label="Primary palette"
              options={BUDDY_PALETTE_COLORS}
              value={cosmetics.primaryPaletteId}
              onChange={(primaryPaletteId) =>
                updateCosmetics({ primaryPaletteId })
              }
            />
            <OptionSelect
              id="buddy-secondary-palette"
              label="Secondary palette"
              options={BUDDY_PALETTE_COLORS}
              value={cosmetics.secondaryPaletteId}
              onChange={(secondaryPaletteId) =>
                updateCosmetics({ secondaryPaletteId })
              }
            />
            <OptionSelect
              id="buddy-accent-palette"
              label="Accent palette"
              options={BUDDY_PALETTE_COLORS}
              value={cosmetics.accentPaletteId}
              onChange={(accentPaletteId) =>
                updateCosmetics({ accentPaletteId })
              }
            />
            <OptionSelect
              id="buddy-pattern"
              label="Markings"
              options={design.patternOptions}
              value={cosmetics.patternId}
              onChange={(patternId) => updateCosmetics({ patternId })}
            />
            <OptionSelect
              id="buddy-definition"
              label="Muscle definition"
              options={BUDDY_DEFINITION_OPTIONS}
              value={cosmetics.muscleDefinitionId}
              onChange={(muscleDefinitionId) =>
                updateCosmetics({
                  muscleDefinitionId:
                    muscleDefinitionId as BuddyCosmetics['muscleDefinitionId'],
                })
              }
            />
            <OptionSelect
              id="buddy-body-size"
              label="Body variation"
              options={BUDDY_BODY_SIZE_OPTIONS}
              value={cosmetics.bodySizeId}
              onChange={(bodySizeId) =>
                updateCosmetics({
                  bodySizeId: bodySizeId as BuddyCosmetics['bodySizeId'],
                })
              }
            />
            <OptionSelect
              id="buddy-appendage"
              label="Species feature"
              options={design.appendageOptions}
              value={cosmetics.appendageVariantId}
              onChange={(appendageVariantId) =>
                updateCosmetics({ appendageVariantId })
              }
            />
            <OptionSelect
              id="buddy-expression"
              label="Expression"
              options={design.expressionOptions}
              value={cosmetics.expressionId}
              onChange={(expressionId) =>
                updateCosmetics({
                  expressionId:
                    expressionId as BuddyCosmetics['expressionId'],
                })
              }
            />
            <OptionSelect
              id="buddy-victory-pose"
              label="Victory pose"
              options={design.victoryPoseOptions}
              value={cosmetics.victoryPoseId}
              onChange={(victoryPoseId) =>
                updateCosmetics({ victoryPoseId })
              }
            />
            <OptionSelect
              id="buddy-entrance-animation"
              label="Entrance"
              options={design.entranceAnimationOptions}
              value={cosmetics.entranceAnimationId}
              onChange={(entranceAnimationId) =>
                updateCosmetics({ entranceAnimationId })
              }
            />
            <OptionSelect
              id="buddy-rare-trait"
              label="Visual trait"
              options={design.rareTraitOptions}
              value={cosmetics.rareTraitId}
              onChange={(rareTraitId) =>
                updateCosmetics({ rareTraitId })
              }
            />
            <OptionSelect
              id="buddy-preview-pose"
              label="Preview animation"
              options={BUDDY_POSE_OPTIONS}
              value={pose}
              onChange={(id) => setPose(id as BuddyPose)}
            />
          </div>

          <fieldset>
            <legend>Species-aware physique presentation</legend>
            <p className="buddy-customizer-help">
              These controls change only how {buddy.creature.name}'s own
              anatomy communicates strength. Protected features:{' '}
              {design.anatomyProfile.protectedFeatures.join(', ')}.
            </p>
            <div className="buddy-customizer-grid">
              {(
                Object.keys(physiqueFieldByRegion) as BuddyPhysiqueRegion[]
              ).map((region) => {
                const field = physiqueFieldByRegion[region];
                return (
                  <OptionSelect
                    id={`buddy-physique-${region}`}
                    key={region}
                    label={design.anatomyProfile.regionLabels[region]}
                    options={BUDDY_EMPHASIS_OPTIONS}
                    value={cosmetics.physique[field]}
                    onChange={(value) =>
                      updatePhysique({
                        [field]: value,
                      } as Partial<BuddyPhysiqueSettings>)
                    }
                  />
                );
              })}
              <OptionSelect
                id="buddy-overall-mass"
                label="Overall mass"
                options={BUDDY_MASS_OPTIONS}
                value={cosmetics.physique.overallMassId}
                onChange={(overallMassId) =>
                  updatePhysique({
                    overallMassId:
                      overallMassId as BuddyPhysiqueSettings['overallMassId'],
                  })
                }
              />
              <OptionSelect
                id="buddy-symmetry"
                label="Symmetry"
                options={BUDDY_SYMMETRY_OPTIONS}
                value={cosmetics.physique.symmetryId}
                onChange={(symmetryId) =>
                  updatePhysique({
                    symmetryId:
                      symmetryId as BuddyPhysiqueSettings['symmetryId'],
                  })
                }
              />
              <OptionSelect
                id="buddy-stance"
                label="Stance"
                options={BUDDY_STANCE_OPTIONS}
                value={cosmetics.physique.stanceId}
                onChange={(stanceId) =>
                  updatePhysique({
                    stanceId: stanceId as BuddyPhysiqueSettings['stanceId'],
                  })
                }
              />
              <OptionSelect
                id="buddy-posture"
                label="Posture"
                options={BUDDY_POSTURE_OPTIONS}
                value={cosmetics.physique.postureId}
                onChange={(postureId) =>
                  updatePhysique({
                    postureId:
                      postureId as BuddyPhysiqueSettings['postureId'],
                  })
                }
              />
              <OptionSelect
                id="buddy-pump"
                label="Pump effect"
                options={BUDDY_PUMP_OPTIONS}
                value={cosmetics.physique.pumpEffectId}
                onChange={(pumpEffectId) =>
                  updatePhysique({
                    pumpEffectId:
                      pumpEffectId as BuddyPhysiqueSettings['pumpEffectId'],
                  })
                }
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>Training accessories · one per slot, up to four</legend>
            <div className="buddy-accessory-grid">
              {design.accessoryOptions
                .filter((entry) => entry.id !== 'accessory-none')
                .map((option) => (
                  <button
                    aria-pressed={cosmetics.accessoryIds.includes(option.id)}
                    className={
                      cosmetics.accessoryIds.includes(option.id)
                        ? 'active'
                        : ''
                    }
                    key={option.id}
                    onClick={() => toggleAccessory(option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
            </div>
          </fieldset>
        </div>
      </div>
    </section>
  );
}
