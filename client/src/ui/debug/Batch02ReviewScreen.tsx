import { useMemo } from 'react';

import {
  BUDDY_BATTLE_POSES,
  BUDDY_SHOWCASE_POSES,
} from '../../game/assets/types';
import {
  BUDDY_ACCESSORY_OPTIONS,
  getBuddyCharacterDesign,
} from '../../game/content/buddyCharacters';
import {
  BOSS_CHARACTER_DESIGNS,
  bossBuddyCosmetics,
} from '../../game/content/bossCharacters';
import { getBuddySpeciesById } from '../../game/content/buddies';
import type {
  BossPresentationTier,
  BuddyCosmetics,
  BuddyFacingDirection,
} from '../../game/types';
import { BuddySprite } from '../buddies/BuddySprite';
import './batch02Review.css';

const DIRECTIONS = ['front', 'back', 'left', 'right'] as const;
const BACKGROUNDS = [
  'light',
  'dark',
  'gym',
  'route',
  'battle',
] as const;
const BOSS_TIERS: readonly BossPresentationTier[] = [
  'normal',
  'pumped',
  'overload',
  'final-round',
  'defeated',
];
type ReviewCharacter = Readonly<{
  id: 'ripped-rhino' | 'spotmole' | 'titan-gorilla' | 'a-rhino';
  label: string;
  speciesId: 'ripped-rhino' | 'spotmole' | 'titan-gorilla';
  bossId?: 'a-rhino';
}>;

const BATCH_CHARACTERS: readonly ReviewCharacter[] = [
  {
    id: 'ripped-rhino',
    label: 'Railhorn',
    speciesId: 'ripped-rhino',
  },
  {
    id: 'spotmole',
    label: 'Spotmole',
    speciesId: 'spotmole',
  },
  {
    id: 'titan-gorilla',
    label: 'Knuckledge',
    speciesId: 'titan-gorilla',
  },
  {
    id: 'a-rhino',
    label: 'A-Rhino',
    speciesId: 'ripped-rhino',
    bossId: 'a-rhino',
  },
];

function cosmeticsForPreset(
  speciesId: string,
  presetId: string,
  pumpEffectId: 'none' | 'full' = 'none',
  accessoryIds?: readonly string[],
): BuddyCosmetics {
  const design = getBuddyCharacterDesign(speciesId);
  const preset =
    design.physiquePresets.find((entry) => entry.id === presetId) ??
    design.physiquePresets[0]!;
  return {
    ...design.defaultCosmetics,
    physiquePresetId: preset.id,
    physique: {
      ...preset.physique,
      pumpEffectId,
    },
    bodySizeId: preset.bodySizeId,
    muscleDefinitionId: preset.muscleDefinitionId,
    accessoryIds: accessoryIds
      ? [...accessoryIds]
      : [...design.defaultCosmetics.accessoryIds],
  };
}

function ReviewFigure({
  children,
  label,
  inspect = false,
}: {
  children: React.ReactNode;
  label: string;
  inspect?: boolean;
}) {
  return (
    <figure className={inspect ? 'batch02-frame-inspection' : undefined}>
      <div className="batch02-sprite-stage">{children}</div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function CharacterReviewSheet({
  character,
}: {
  character: ReviewCharacter;
}) {
  const species = getBuddySpeciesById(character.speciesId);
  const design = getBuddyCharacterDesign(character.speciesId);
  const bossDesign = character.bossId
    ? BOSS_CHARACTER_DESIGNS.find(
        (entry) => entry.bossId === character.bossId,
      )
    : undefined;
  const balancedPreset =
    design.physiquePresets.find((preset) =>
      preset.id.endsWith('-balanced'),
    ) ?? design.physiquePresets[0]!;
  const defaultCosmetics = bossDesign
    ? bossBuddyCosmetics(bossDesign, 'normal')
    : cosmeticsForPreset(
        species.id,
        balancedPreset.id,
        'none',
      );
  const pumpedCosmetics = bossDesign
    ? bossBuddyCosmetics(bossDesign, 'pumped')
    : cosmeticsForPreset(
        species.id,
        balancedPreset.id,
        'full',
      );
  const isBoss = Boolean(character.bossId);

  const accessoryCases = useMemo(() => {
    if (species.id !== 'ripped-rhino') {
      return BUDDY_ACCESSORY_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        accessoryIds: [option.id],
      }));
    }
    return [
      ...BUDDY_ACCESSORY_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        accessoryIds: [option.id],
      })),
      {
        id: 'railhorn-valid-full-stack',
        label: 'Valid full equipment stack',
        accessoryIds: [
          'accessory-wraps',
          'accessory-elbow-sleeves',
          'accessory-belt',
          'accessory-chain',
          'accessory-victory-medal',
        ],
      },
    ];
  }, [species.id]);
  const extremePresets = design.physiquePresets.filter(
    (preset) =>
      preset.id.endsWith('-compact') ||
      preset.id.endsWith('-broad') ||
      preset.id.endsWith('-specialized'),
  );

  return (
    <article
      className="batch02-review-sheet"
      data-review-character={character.id}
    >
      <header>
        <p>Formal visual gate · 2026-07-30 · review evidence</p>
        <h1>{character.label}</h1>
        <span>
          {species.id}
          {character.bossId ? ` · boss ${character.bossId}` : ''}
        </span>
      </header>

      <section>
        <h2>Cross-resolution identity and four directions</h2>
        <div className="batch02-review-grid batch02-resolution-grid">
          {DIRECTIONS.map((direction) => (
            <ReviewFigure
              inspect
              key={`overworld-${direction}`}
              label={`24×24 · ${direction}`}
            >
              <BuddySprite
                bossId={character.bossId}
                bossTier={isBoss ? 'normal' : undefined}
                cosmetics={defaultCosmetics}
                creature={species}
                direction={direction}
                presentationContext="overworld"
                reducedMotion
                scale={3}
              />
            </ReviewFigure>
          ))}
          {DIRECTIONS.map((direction) => (
            <ReviewFigure
              inspect
              key={`menu-${direction}`}
              label={`32×32 · ${direction}`}
            >
              <BuddySprite
                bossId={character.bossId}
                bossTier={isBoss ? 'normal' : undefined}
                cosmetics={defaultCosmetics}
                creature={species}
                direction={direction}
                presentationContext="menu"
                reducedMotion
                scale={2}
              />
            </ReviewFigure>
          ))}
          <ReviewFigure inspect label={isBoss ? '48×48 · derived base' : '48×48 · battle'}>
            <BuddySprite
              cosmetics={defaultCosmetics}
              creature={species}
              battlePose="neutral-battle"
              presentationContext="battle"
              reducedMotion
              scale={1.5}
            />
          </ReviewFigure>
          {isBoss ? (
            <ReviewFigure inspect label="64×64 · boss battle">
              <BuddySprite
                bossId={character.bossId}
                bossTier="normal"
                cosmetics={defaultCosmetics}
                creature={species}
                battlePose="neutral-battle"
                presentationContext="battle"
                reducedMotion
                scale={1.25}
              />
            </ReviewFigure>
          ) : null}
          <ReviewFigure inspect label="64×64 · showcase">
            <BuddySprite
              bossId={character.bossId}
              bossTier={isBoss ? 'normal' : undefined}
              cosmetics={defaultCosmetics}
              creature={species}
              presentationContext="showcase"
              reducedMotion
              scale={1.25}
              showcasePose="front-relaxed"
            />
          </ReviewFigure>
          <ReviewFigure inspect label="64×64 · portrait">
            <BuddySprite
              bossId={character.bossId}
              bossTier={isBoss ? 'normal' : undefined}
              cosmetics={defaultCosmetics}
              creature={species}
              presentationContext="dialogue"
              reducedMotion
              scale={1.25}
            />
          </ReviewFigure>
        </div>
      </section>

      <section>
        <h2>Compact, Balanced, Broad, Specialized, and species-specific</h2>
        <div className="batch02-preset-matrix">
          {design.physiquePresets.map((preset) => (
            <div key={preset.id} data-review-preset={preset.id}>
              <h3>{preset.label}</h3>
              <div className="batch02-review-grid batch02-direction-grid">
                {DIRECTIONS.map((direction) => (
                  <ReviewFigure key={direction} label={direction}>
                    <BuddySprite
                      bossId={character.bossId}
                      bossTier={isBoss ? 'normal' : undefined}
                      cosmetics={cosmeticsForPreset(
                        species.id,
                        preset.id,
                        'none',
                        defaultCosmetics.accessoryIds,
                      )}
                      creature={species}
                      direction={direction}
                      presentationContext="menu"
                      reducedMotion
                      scale={2}
                    />
                  </ReviewFigure>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Neutral and pumped states</h2>
        <div className="batch02-review-grid batch02-state-grid">
          {[
            ['Neutral', defaultCosmetics],
            ['Pumped', pumpedCosmetics],
          ].map(([label, cosmetics]) => (
            <ReviewFigure key={label as string} label={label as string}>
              <BuddySprite
                bossId={character.bossId}
                bossTier={
                  isBoss && label === 'Pumped' ? 'pumped' : isBoss ? 'normal' : undefined
                }
                cosmetics={cosmetics as BuddyCosmetics}
                creature={species}
                battlePose="neutral-battle"
                presentationContext="battle"
                reducedMotion
                scale={isBoss ? 1.5 : 2}
              />
            </ReviewFigure>
          ))}
        </div>
      </section>

      <section>
        <h2>All authored battle actions</h2>
        <div className="batch02-review-grid batch02-action-grid">
          {BUDDY_BATTLE_POSES.map((battlePose) => (
            <ReviewFigure key={battlePose} label={battlePose}>
              <BuddySprite
                bossId={character.bossId}
                bossTier={isBoss ? 'normal' : undefined}
                cosmetics={defaultCosmetics}
                creature={species}
                battlePose={battlePose}
                presentationContext="battle"
                reducedMotion
                scale={isBoss ? 1 : 1.35}
              />
            </ReviewFigure>
          ))}
        </div>
      </section>

      <section>
        <h2>Showcase poses</h2>
        <div className="batch02-review-grid batch02-action-grid">
          {BUDDY_SHOWCASE_POSES.map((showcasePose) => (
            <ReviewFigure key={showcasePose} label={showcasePose}>
              <BuddySprite
                bossId={character.bossId}
                bossTier={isBoss ? 'normal' : undefined}
                cosmetics={defaultCosmetics}
                creature={species}
                presentationContext="showcase"
                reducedMotion
                scale={1}
                showcasePose={showcasePose}
              />
            </ReviewFigure>
          ))}
        </div>
      </section>

      <section>
        <h2>Light, dark, gym, route, and battle backgrounds</h2>
        <div className="batch02-review-grid batch02-background-grid">
          {BACKGROUNDS.map((background) => (
            <ReviewFigure key={background} label={background}>
              <div className={`batch02-review-background is-${background}`}>
                <BuddySprite
                  bossId={character.bossId}
                  bossTier={isBoss ? 'pumped' : undefined}
                  cosmetics={pumpedCosmetics}
                  creature={species}
                  battlePose="iron-grind"
                  presentationContext="battle"
                  reducedMotion
                  scale={isBoss ? 1 : 1.35}
                />
              </div>
            </ReviewFigure>
          ))}
        </div>
      </section>

      <section>
        <h2>Mobile size, silhouette, anchors, and frame bounds</h2>
        <div className="batch02-review-grid batch02-inspection-grid">
          <ReviewFigure label="390×844 mobile-size presentation">
            <div className="batch02-mobile-frame">
              <BuddySprite
                bossId={character.bossId}
                bossTier={isBoss ? 'normal' : undefined}
                cosmetics={defaultCosmetics}
                creature={species}
                battlePose="neutral-battle"
                presentationContext="battle"
                reducedMotion
                scale={1}
              />
              <span>native in-game scale</span>
            </div>
          </ReviewFigure>
          <ReviewFigure label="full-color silhouette">
            <BuddySprite
              bossId={character.bossId}
              bossTier={isBoss ? 'normal' : undefined}
              cosmetics={defaultCosmetics}
              creature={species}
              presentationContext="showcase"
              reducedMotion
              scale={1.25}
              showcasePose="front-relaxed"
            />
          </ReviewFigure>
          <ReviewFigure label="silhouette-only">
            <BuddySprite
              bossId={character.bossId}
              bossTier={isBoss ? 'normal' : undefined}
              cosmetics={defaultCosmetics}
              creature={species}
              presentationContext="showcase"
              reducedMotion
              scale={1.25}
              showcasePose="front-relaxed"
              silhouetteOnly
            />
          </ReviewFigure>
          <ReviewFigure inspect label="bottom-center anchor + bounds">
            <BuddySprite
              bossId={character.bossId}
              bossTier={isBoss ? 'normal' : undefined}
              cosmetics={defaultCosmetics}
              creature={species}
              battlePose="near-pin"
              presentationContext="battle"
              reducedMotion
              scale={1.25}
            />
          </ReviewFigure>
        </div>
      </section>

      <section>
        <h2>Accessory scale and alignment</h2>
        <div className="batch02-review-grid batch02-accessory-grid">
          {accessoryCases.map((accessoryCase) => (
            <ReviewFigure
              key={accessoryCase.id}
              label={accessoryCase.label}
            >
              <BuddySprite
                bossId={character.bossId}
                bossTier={isBoss ? 'normal' : undefined}
                cosmetics={{
                  ...defaultCosmetics,
                  accessoryIds: [...accessoryCase.accessoryIds],
                }}
                creature={species}
                presentationContext="showcase"
                reducedMotion
                scale={1}
                showcasePose="front-relaxed"
              />
            </ReviewFigure>
          ))}
        </div>
      </section>

      {species.id === 'ripped-rhino' ? (
        <section>
          <h2>Railhorn extreme accessory matrix</h2>
          <p>
            Every accessory and the valid multi-slot stack across Compact,
            Broad, and Specialized physiques in all four directions.
          </p>
          <div className="batch02-extreme-matrix">
            {extremePresets.flatMap((preset) =>
              accessoryCases.map((accessoryCase) => (
                <div
                  data-extreme-accessory={accessoryCase.id}
                  data-extreme-preset={preset.id}
                  key={`${preset.id}-${accessoryCase.id}`}
                >
                  <h3>
                    {preset.label} · {accessoryCase.label}
                  </h3>
                  <div className="batch02-review-grid batch02-direction-grid">
                    {DIRECTIONS.map((direction) => (
                      <ReviewFigure key={direction} label={direction}>
                        <BuddySprite
                          bossId={character.bossId}
                          bossTier={isBoss ? 'normal' : undefined}
                          cosmetics={cosmeticsForPreset(
                            species.id,
                            preset.id,
                            'full',
                            accessoryCase.accessoryIds,
                          )}
                          creature={species}
                          direction={direction}
                          presentationContext="menu"
                          reducedMotion
                          scale={2}
                        />
                      </ReviewFigure>
                    ))}
                  </div>
                </div>
              )),
            )}
          </div>
        </section>
      ) : null}

      {isBoss && bossDesign ? (
        <section>
          <h2>A-Rhino boss tier identity</h2>
          <div className="batch02-tier-matrix">
            {BOSS_TIERS.map((tier) => (
              <div data-boss-review-tier={tier} key={tier}>
                <h3>{tier}</h3>
                <ReviewFigure label="battle">
                  <BuddySprite
                    bossId={character.bossId}
                    bossTier={tier}
                    cosmetics={bossBuddyCosmetics(bossDesign, tier)}
                    creature={species}
                    battlePose={
                      tier === 'defeated'
                        ? 'defeat'
                        : tier === 'final-round'
                          ? 'shoulder-burst'
                          : 'neutral-battle'
                    }
                    presentationContext="battle"
                    reducedMotion
                    scale={1}
                  />
                </ReviewFigure>
                <ReviewFigure label="showcase">
                  <BuddySprite
                    bossId={character.bossId}
                    bossTier={tier}
                    cosmetics={bossBuddyCosmetics(bossDesign, tier)}
                    creature={species}
                    presentationContext="showcase"
                    reducedMotion
                    scale={1}
                    showcasePose={
                      tier === 'defeated'
                        ? 'fatigue-pose'
                        : tier === 'final-round'
                          ? 'most-muscular'
                          : 'front-relaxed'
                    }
                  />
                </ReviewFigure>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

export function Batch02ReviewScreen() {
  return (
    <main className="batch02-review-shell">
      <nav>
        <a href="?debug=sprites">Sprite Strip Lab</a>
        <a href="?debug=characters">Character Gallery</a>
        <a href="./">Game</a>
      </nav>
      {BATCH_CHARACTERS.map((character) => (
        <CharacterReviewSheet
          character={character}
          key={character.id}
        />
      ))}
    </main>
  );
}
