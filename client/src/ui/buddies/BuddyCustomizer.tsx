import { useMemo, useState } from 'react';

import {
  BUDDY_BODY_SIZE_OPTIONS,
  BUDDY_DEFINITION_OPTIONS,
  BUDDY_PALETTE_COLORS,
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
  BuddyVisualOption,
} from '../../game/types';
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
const POSES: BuddyPose[] = [
  'idle',
  'walking',
  'running',
  'training',
  'victory',
  'fatigue',
  'capture',
  'entrance',
];

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
    const next = current.includes(id)
      ? current.filter((entry) => entry !== id)
      : [...current, id].slice(-2);
    updateCosmetics({
      accessoryIds: next.length > 0 ? next : ['accessory-none'],
    });
  }

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
            reducedMotion={reducedMotion}
            scale={4}
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
              options={POSES.map((id) => ({
                id,
                label: id.replace('-', ' '),
              }))}
              value={pose}
              onChange={(id) => setPose(id as BuddyPose)}
            />
          </div>

          <fieldset>
            <legend>Training accessories · choose up to two</legend>
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
