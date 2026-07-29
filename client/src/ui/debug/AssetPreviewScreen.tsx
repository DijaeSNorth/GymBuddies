import { useEffect, useMemo, useRef, useState } from 'react';

import { resolveAssetUrl } from '../../game/assets/assetUrl';
import {
  ASSET_MANIFEST,
  getAssetStandard,
  isImageAsset,
} from '../../game/assets/manifest';
import {
  applyPaletteSwap,
  createTrainerPaletteMap,
  type TrainerPaletteSwap,
} from '../../game/assets/paletteSwap';
import { ASSET_CATEGORIES, type AssetCategory } from '../../game/assets/types';
import { validateAssetManifest } from '../../game/assets/validation';
import {
  DEFAULT_TRAINER_APPEARANCE,
  TRAINER_BOTTOMS,
  TRAINER_PHYSIQUE_PRESETS,
  TRAINER_TOPS,
  cloneTrainerAppearance,
} from '../../game/content/trainerAppearance';
import { BUDDY_SPECIES } from '../../game/content/buddies';
import {
  BUDDY_BODY_SIZE_OPTIONS,
  getBuddyCharacterDesign,
} from '../../game/content/buddyCharacters';
import {
  BOSS_CHARACTER_DESIGNS,
  bossBuddyCosmetics,
} from '../../game/content/bossCharacters';
import { getBossById } from '../../game/content/bosses';
import {
  GYM_LEADER_CHARACTER_DESIGNS,
  MUSCULAR_BODY_ARCHETYPES,
  NPC_CHARACTER_SEEDS,
  RIVAL_CHARACTER_DESIGNS,
} from '../../game/content/characters';
import {
  createNpcCharacterDesign,
  trainerAppearanceFromCharacterDesign,
} from '../../game/systems/characterDesign';
import type { TrainerPose } from '../../game/types';
import { BuddySprite } from '../buddies/BuddySprite';
import { TrainerPixelSprite } from '../trainer/TrainerPixelSprite';
import './assetPreview.css';

const PALETTE_PRESETS: Array<{ id: string; name: string; palette: TrainerPaletteSwap }> = [
  {
    id: 'mint-coral',
    name: 'Mint / Coral',
    palette: {
      outline: '#061519',
      hair: '#18343a',
      skin: '#f2c38b',
      top: '#ef6a5b',
      shoes: '#285057',
      glove: '#68d39b',
      highlight: '#eef2d0',
    },
  },
  {
    id: 'amber-teal',
    name: 'Amber / Teal',
    palette: {
      outline: '#061519',
      hair: '#472f3c',
      skin: '#9d624b',
      top: '#f2c14e',
      shoes: '#0c2b2f',
      glove: '#b9d8c4',
      highlight: '#eef2d0',
    },
  },
  {
    id: 'chalk-plum',
    name: 'Chalk / Plum',
    palette: {
      outline: '#061519',
      hair: '#c8d3bd',
      skin: '#6e402f',
      top: '#704f73',
      shoes: '#285057',
      glove: '#ef6a5b',
      highlight: '#eef2d0',
    },
  },
];

const CHARACTER_GALLERY_POSES: TrainerPose[] = [
  'idle',
  'walking',
  'running',
  'training',
  'victory',
  'fatigue',
  'capture',
  'boss-introduction',
];

const CHARACTER_GALLERY_DIRECTIONS = [
  'front',
  'back',
  'left',
  'right',
] as const;

function PaletteCanvas({
  palette,
  title,
}: {
  palette: TrainerPaletteSwap;
  title: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const asset = ASSET_MANIFEST.assets.find((entry) => entry.key === 'trainer.overworld.base');
    if (!asset) return;
    const image = new Image();
    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      const source = context.getImageData(0, 0, canvas.width, canvas.height);
      const swapped = applyPaletteSwap(source.data, createTrainerPaletteMap(palette));
      context.putImageData(new ImageData(swapped, canvas.width, canvas.height), 0, 0);
    };
    image.src = resolveAssetUrl(asset.path);
  }, [palette]);

  return (
    <figure className="asset-palette-card">
      <canvas ref={canvasRef} aria-label={`${title} trainer palette preview`} />
      <figcaption>{title}</figcaption>
    </figure>
  );
}

export function AssetPreviewScreen() {
  const [category, setCategory] = useState<AssetCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const issues = useMemo(() => validateAssetManifest(ASSET_MANIFEST), []);
  const visibleAssets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return ASSET_MANIFEST.assets.filter((asset) => {
      if (category !== 'all' && asset.category !== category) return false;
      if (!normalizedSearch) return true;
      return `${asset.key} ${asset.path} ${asset.description}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [category, search]);

  return (
    <main className="asset-debug-shell">
      <header className="asset-debug-header">
        <div>
          <p className="asset-debug-kicker">Development tool · manifest v{ASSET_MANIFEST.version}</p>
          <h1>Gym Buddies Asset Deck</h1>
          <p>
            Original placeholder sheets, stable runtime keys, frame geometry, and trainer palette swaps.
          </p>
        </div>
        <a href="./" className="asset-debug-back">
          Return to game
        </a>
      </header>

      <section className="asset-debug-toolbar" aria-label="Asset filters">
        <label>
          Search assets
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="key, path, or purpose"
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as AssetCategory | 'all')}
          >
            <option value="all">All categories</option>
            {ASSET_CATEGORIES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        <div className={`asset-debug-health ${issues.length === 0 ? 'healthy' : 'broken'}`}>
          <strong>{issues.length === 0 ? 'Manifest healthy' : `${issues.length} manifest issues`}</strong>
          <span>{ASSET_MANIFEST.assets.length} registered assets</span>
        </div>
      </section>

      {issues.length > 0 ? (
        <section className="asset-debug-issues" aria-labelledby="asset-issues-title">
          <h2 id="asset-issues-title">Manifest issues</h2>
          <ul>
            {issues.map((issue) => (
              <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="asset-debug-section" aria-labelledby="palette-preview-title">
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Indexed colors</p>
            <h2 id="palette-preview-title">Trainer palette swaps</h2>
          </div>
          <p>Exact marker colors are replaced after load; transparent pixels and non-markers are preserved.</p>
        </div>
        <div className="asset-palette-grid">
          {PALETTE_PRESETS.map((preset) => (
            <PaletteCanvas key={preset.id} title={preset.name} palette={preset.palette} />
          ))}
        </div>
      </section>

      <section className="asset-debug-section" aria-labelledby="asset-grid-title">
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Preview at nearest neighbor</p>
            <h2 id="asset-grid-title">Asset manifest</h2>
          </div>
          <p>{visibleAssets.length} assets match the current filter.</p>
        </div>
        <div className="asset-preview-grid">
          {visibleAssets.map((asset) => {
            const standard = getAssetStandard(asset);
            return (
              <article className="asset-preview-card" key={asset.key}>
                <div className="asset-preview-stage">
                  {isImageAsset(asset) ? (
                    <img
                      src={resolveAssetUrl(asset.path)}
                      alt={`${asset.key} sprite sheet`}
                      loading="lazy"
                    />
                  ) : (
                    <audio controls preload="none" src={resolveAssetUrl(asset.path)}>
                      Audio preview for {asset.key}
                    </audio>
                  )}
                </div>
                <div className="asset-preview-copy">
                  <div className="asset-preview-title">
                    <strong>{asset.key}</strong>
                    <span data-status={asset.status}>{asset.status}</span>
                  </div>
                  <p>{asset.description}</p>
                  <dl>
                    <div>
                      <dt>Category</dt>
                      <dd>{asset.category}</dd>
                    </div>
                    <div>
                      <dt>Standard</dt>
                      <dd>{asset.standardId}</dd>
                    </div>
                    {standard.mediaType === 'image' ? (
                      <>
                        <div>
                          <dt>Frame</dt>
                          <dd>{standard.frameWidth}×{standard.frameHeight}</dd>
                        </div>
                        <div>
                          <dt>Sheet</dt>
                          <dd>
                            {standard.frameWidth * standard.columns}×
                            {standard.frameHeight * standard.rows}
                          </dd>
                        </div>
                        <div>
                          <dt>Anchor</dt>
                          <dd>{standard.anchor}</dd>
                        </div>
                      </>
                    ) : (
                      <div>
                        <dt>Audio</dt>
                        <dd>
                          {'durationMs' in asset ? asset.durationMs : 0} ms · {standard.sampleRate} Hz
                        </dd>
                      </div>
                    )}
                  </dl>
                  <code>{asset.path}</code>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="asset-debug-section" aria-labelledby="trainer-gallery-title">
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Development-only render matrix</p>
            <h2 id="trainer-gallery-title">Trainer silhouette gallery</h2>
          </div>
          <p>
            Eight modular physique presets share one bottom-center anchor across
            front, back, left, and right directions.
          </p>
        </div>
        <div className="trainer-debug-gallery">
          {TRAINER_PHYSIQUE_PRESETS.map((preset, presetIndex) => {
            const appearance = cloneTrainerAppearance(
              DEFAULT_TRAINER_APPEARANCE,
            );
            appearance.build = { ...preset.build };
            appearance.colors.topPrimaryId = [
              'ocean',
              'coral',
              'amber',
              'teal',
              'plum',
              'moss',
              'brick',
              'violet',
            ][presetIndex]!;
            return (
              <article key={preset.id}>
                <h3>{preset.label}</h3>
                <div>
                  {(['front', 'back', 'left', 'right'] as const).map(
                    (direction) => (
                      <figure key={direction}>
                        <TrainerPixelSprite
                          animated={false}
                          appearance={appearance}
                          direction={direction}
                          label={`${preset.label} ${direction}`}
                          reducedMotion
                          scale={2}
                        />
                        <figcaption>{direction}</figcaption>
                      </figure>
                    ),
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="asset-debug-section"
        aria-labelledby="archetype-gallery-title"
      >
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Shared muscular design grammar</p>
            <h2 id="archetype-gallery-title">Every body archetype</h2>
          </div>
          <p>
            Ten powerful silhouettes use posture and proportion—not only
            scale—to communicate different kinds of strength.
          </p>
        </div>
        <div className="trainer-debug-gallery">
          {MUSCULAR_BODY_ARCHETYPES.map((archetype) => {
            const base = GYM_LEADER_CHARACTER_DESIGNS[0]!;
            const design = {
              ...base,
              id: `gallery-${archetype.id}`,
              appearance: {
                ...base.appearance,
                archetypeId: archetype.id,
              },
            };
            const appearance = trainerAppearanceFromCharacterDesign(design);
            return (
              <article key={archetype.id}>
                <h3>{archetype.label}</h3>
                <p className="character-gallery-note">
                  {archetype.silhouette} {archetype.strengthLanguage}
                </p>
                <div>
                  {CHARACTER_GALLERY_DIRECTIONS.map((direction) => (
                    <figure key={direction}>
                      <TrainerPixelSprite
                        animated={false}
                        appearance={appearance}
                        direction={direction}
                        label={`${archetype.label} ${direction}`}
                        reducedMotion
                        scale={2}
                      />
                      <figcaption>{direction}</figcaption>
                    </figure>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="asset-debug-section"
        aria-labelledby="animation-gallery-title"
      >
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Pose and outfit coverage</p>
            <h2 id="animation-gallery-title">Animations and outfit modules</h2>
          </div>
          <p>
            Every supported pose and clothing module keeps the same
            bottom-center anchor and crisp nearest-neighbor pixels.
          </p>
        </div>
        <div className="character-animation-gallery">
          {CHARACTER_GALLERY_POSES.map((pose) => (
            <figure key={pose}>
              <TrainerPixelSprite
                animated={false}
                appearance={trainerAppearanceFromCharacterDesign(
                  RIVAL_CHARACTER_DESIGNS[1]!,
                )}
                label={`${pose} pose`}
                pose={pose}
                reducedMotion
                scale={2}
              />
              <figcaption>{pose}</figcaption>
            </figure>
          ))}
          {TRAINER_TOPS.map((top, index) => {
            const appearance = cloneTrainerAppearance(
              trainerAppearanceFromCharacterDesign(
                GYM_LEADER_CHARACTER_DESIGNS[index % GYM_LEADER_CHARACTER_DESIGNS.length]!,
              ),
            );
            appearance.outfit.topId = top.id;
            appearance.outfit.bottomsId =
              TRAINER_BOTTOMS[index % TRAINER_BOTTOMS.length]!.id;
            return (
              <figure key={top.id}>
                <TrainerPixelSprite
                  animated={false}
                  appearance={appearance}
                  label={`${top.label} outfit`}
                  reducedMotion
                  scale={2}
                />
                <figcaption>
                  {top.label} · {TRAINER_BOTTOMS[index % TRAINER_BOTTOMS.length]!.label}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      <section
        className="asset-debug-section"
        aria-labelledby="major-character-gallery-title"
      >
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Handcrafted and seeded trainers</p>
            <h2 id="major-character-gallery-title">
              Leaders, rivals, and route trainers
            </h2>
          </div>
          <p>
            Important characters are handcrafted. Route trainers are
            deterministic combinations from validated templates.
          </p>
        </div>
        <div className="major-character-gallery">
          {[
            ...GYM_LEADER_CHARACTER_DESIGNS,
            ...RIVAL_CHARACTER_DESIGNS,
            ...NPC_CHARACTER_SEEDS.map(createNpcCharacterDesign),
          ].map((character) => (
            <article key={character.id}>
              <TrainerPixelSprite
                animated={false}
                appearance={trainerAppearanceFromCharacterDesign(character)}
                label={character.name}
                pose={character.signaturePose}
                reducedMotion
                scale={2.25}
              />
              <div>
                <h3>{character.name}</h3>
                <span>
                  {character.kind} · {character.discipline}
                </span>
                <p>{character.trainingPhilosophy}</p>
                <small>
                  {character.signatureClothing} ·{' '}
                  {character.signatureEquipment}
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="asset-debug-section"
        aria-labelledby="buddy-gallery-title"
      >
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Species-locked modular sprites</p>
            <h2 id="buddy-gallery-title">Buddy variation matrix</h2>
          </div>
          <p>
            All sixteen species retain a unique silhouette while body size,
            markings, appendages, accessories, palettes, and expressions vary.
          </p>
        </div>
        <div className="buddy-debug-gallery">
          {BUDDY_SPECIES.map((species, speciesIndex) => {
            const design = getBuddyCharacterDesign(species.id);
            return (
              <article key={species.id}>
                <div className="buddy-debug-heading">
                  <div>
                    <h3>{species.name}</h3>
                    <span>{design.buildLabel}</span>
                  </div>
                  <code>{design.silhouetteModuleId}</code>
                </div>
                <div className="buddy-debug-variations">
                  {BUDDY_BODY_SIZE_OPTIONS.map((size, sizeIndex) => (
                    <figure key={size.id}>
                      <BuddySprite
                        compact
                        cosmetics={{
                          ...design.defaultCosmetics,
                          bodySizeId:
                            size.id as typeof design.defaultCosmetics.bodySizeId,
                          patternId:
                            design.patternOptions[
                              (speciesIndex + sizeIndex) %
                                design.patternOptions.length
                            ]!.id,
                          appendageVariantId:
                            design.appendageOptions[
                              sizeIndex % design.appendageOptions.length
                            ]!.id,
                          expressionId:
                            design.expressionOptions[
                              (speciesIndex + sizeIndex) %
                                design.expressionOptions.length
                            ]!.id as typeof design.defaultCosmetics.expressionId,
                        }}
                        creature={species}
                        direction={
                          CHARACTER_GALLERY_DIRECTIONS[
                            sizeIndex % CHARACTER_GALLERY_DIRECTIONS.length
                          ]
                        }
                        label={`${species.name} ${size.label}`}
                        pose={sizeIndex === 2 ? 'victory' : 'idle'}
                        reducedMotion
                        scale={2}
                      />
                      <figcaption>{size.label}</figcaption>
                    </figure>
                  ))}
                </div>
                <small>{design.trainingSpecialization}</small>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="asset-debug-section"
        aria-labelledby="boss-character-gallery-title"
      >
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Twelve signature challengers</p>
            <h2 id="boss-character-gallery-title">Boss character gallery</h2>
          </div>
          <p>
            Size, posture, definition, equipment, palette, stance, and
            personality distinguish power levels.
          </p>
        </div>
        <div className="boss-character-gallery">
          {BOSS_CHARACTER_DESIGNS.map((design) => {
            const boss = getBossById(design.bossId)!;
            const species = BUDDY_SPECIES.find(
              (entry) => entry.id === boss.speciesId,
            )!;
            return (
              <article key={design.id}>
                <BuddySprite
                  animationCueId={design.entranceAnimationId}
                  animated={false}
                  cosmetics={bossBuddyCosmetics(design)}
                  creature={species}
                  label={boss.name}
                  pose="entrance"
                  reducedMotion
                  scale={2.4}
                />
                <div>
                  <h3>{boss.name}</h3>
                  <span>{design.buildLabel}</span>
                  <p>{design.trainingPhilosophy}</p>
                  <small>{design.battleStance}</small>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
