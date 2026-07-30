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
import {
  ASSET_CATEGORIES,
  BUDDY_BATTLE_POSES,
  BUDDY_SHOWCASE_POSES,
  type AssetCategory,
} from '../../game/assets/types';
import { validateAssetManifest } from '../../game/assets/validation';
import {
  DEFAULT_TRAINER_APPEARANCE,
  TRAINER_BUILD_ATTRIBUTES,
  TRAINER_BOTTOMS,
  TRAINER_PHYSIQUE_PRESETS,
  TRAINER_SKIN_TONES,
  TRAINER_TOPS,
  cloneTrainerAppearance,
} from '../../game/content/trainerAppearance';
import { TRAINER_POSE_DEFINITIONS } from '../../game/content/bodybuilding';
import { BUDDY_SPECIES } from '../../game/content/buddies';
import {
  BUDDY_POSE_OPTIONS,
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
import type {
  BuddyPose,
  TrainerAppearance,
  TrainerBuildAttributeId,
} from '../../game/types';
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

const MULTI_RESOLUTION_PILOTS = [
  { label: 'Bramblift', speciesId: 'brawny-bear' },
  { label: 'Rivetjack', speciesId: 'iron-wolf' },
  { label: 'Prismantle', speciesId: 'prismantle' },
  {
    bossId: 'home-watchman',
    label: 'Mat Watchman',
    speciesId: 'brawny-bear',
  },
  { label: 'Railhorn', speciesId: 'ripped-rhino' },
  { label: 'Spotmole', speciesId: 'spotmole' },
  { label: 'Knuckledge', speciesId: 'titan-gorilla' },
  {
    bossId: 'a-rhino',
    label: 'A-Rhino',
    speciesId: 'ripped-rhino',
  },
] as const;

const CHARACTER_GALLERY_DIRECTIONS = [
  'front',
  'back',
  'left',
  'right',
] as const;

const GALLERY_TOP_COLOR_IDS = [
  'ocean',
  'coral',
  'amber',
  'teal',
  'plum',
  'moss',
  'brick',
  'violet',
] as const;

const BODY_RANGE_PREVIEWS = [
  { id: 'minimum', label: 'Minimum · Athletic', value: 0, skinToneId: TRAINER_SKIN_TONES[0]!.id },
  { id: 'middle', label: 'Middle · Developed', value: 5, skinToneId: TRAINER_SKIN_TONES[5]!.id },
  { id: 'maximum', label: 'Maximum · Showcase', value: 10, skinToneId: TRAINER_SKIN_TONES[9]!.id },
] as const;

function trainerAppearanceAtBuild(
  value: number,
  skinToneId = DEFAULT_TRAINER_APPEARANCE.colors.skinToneId,
): TrainerAppearance {
  const appearance = cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE);
  TRAINER_BUILD_ATTRIBUTES.forEach(({ key }) => {
    appearance.build[key] = value;
  });
  appearance.colors.skinToneId = skinToneId;
  return appearance;
}

function muscleLabel(id: TrainerBuildAttributeId) {
  return TRAINER_BUILD_ATTRIBUTES.find((attribute) => attribute.id === id)?.label ?? id;
}

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
            Fourteen modular physique presets share one bottom-center anchor across
            front, back, left, and right directions.
          </p>
        </div>
        <div className="trainer-debug-gallery">
          {TRAINER_PHYSIQUE_PRESETS.map((preset, presetIndex) => {
            const appearance = cloneTrainerAppearance(
              DEFAULT_TRAINER_APPEARANCE,
            );
            appearance.build = { ...preset.build };
            appearance.colors.topPrimaryId =
              GALLERY_TOP_COLOR_IDS[presetIndex % GALLERY_TOP_COLOR_IDS.length]!;
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
        aria-labelledby="multires-pilot-gallery-title"
      >
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Native context sheets</p>
            <h2 id="multires-pilot-gallery-title">
              Multi-resolution review gallery
            </h2>
          </div>
          <p>
            Approved pilot references and the armored/heavy review batch use
            authored native frames. The 24×24 overworld standard remains
            unchanged.
          </p>
        </div>
        <div className="multires-pilot-gallery">
          {MULTI_RESOLUTION_PILOTS.map((pilot) => {
            const species = BUDDY_SPECIES.find(
              (entry) => entry.id === pilot.speciesId,
            )!;
            const design = getBuddyCharacterDesign(species.id);
            const bossId = 'bossId' in pilot ? pilot.bossId : undefined;
            return (
              <article key={pilot.label}>
                <h3>{pilot.label}</h3>
                <div className="multires-menu-row">
                  {CHARACTER_GALLERY_DIRECTIONS.map((direction) => (
                    <figure key={direction}>
                      <BuddySprite
                        bossId={bossId}
                        cosmetics={design.defaultCosmetics}
                        creature={species}
                        direction={direction}
                        label={`${pilot.label} ${direction} menu`}
                        presentationContext="menu"
                        reducedMotion
                        scale={1}
                      />
                      <figcaption>{direction} · 32</figcaption>
                    </figure>
                  ))}
                </div>
                <div className="multires-pose-row">
                  {BUDDY_BATTLE_POSES.map((battlePose) => (
                    <figure key={battlePose}>
                      <BuddySprite
                        battlePose={battlePose}
                        bossId={bossId}
                        bossTier={bossId ? 'final-round' : undefined}
                        cosmetics={design.defaultCosmetics}
                        creature={species}
                        label={`${pilot.label} ${battlePose}`}
                        presentationContext="battle"
                        reducedMotion
                        scale={1}
                      />
                      <figcaption>{battlePose}</figcaption>
                    </figure>
                  ))}
                </div>
                <div className="multires-pose-row">
                  {BUDDY_SHOWCASE_POSES.map((showcasePose) => (
                    <figure key={showcasePose}>
                      <BuddySprite
                        bossId={bossId}
                        bossTier={bossId ? 'final-round' : undefined}
                        cosmetics={design.defaultCosmetics}
                        creature={species}
                        label={`${pilot.label} ${showcasePose}`}
                        presentationContext="showcase"
                        reducedMotion
                        scale={1}
                        showcasePose={showcasePose}
                      />
                      <figcaption>{showcasePose}</figcaption>
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
        aria-labelledby="body-range-gallery-title"
      >
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Silhouette boundary validation</p>
            <h2 id="body-range-gallery-title">Minimum, middle, and maximum builds</h2>
          </div>
          <p>
            Every cosmetic body control is set together at its lowest, middle,
            and highest value. The minimum remains athletic; the maximum retains
            negative space and readable limb separation.
          </p>
        </div>
        <div className="body-range-gallery">
          {BODY_RANGE_PREVIEWS.map((preview) => {
            const appearance = trainerAppearanceAtBuild(
              preview.value,
              preview.skinToneId,
            );
            return (
              <article key={preview.id} data-build-range={preview.id}>
                <h3>{preview.label}</h3>
                <div>
                  {CHARACTER_GALLERY_DIRECTIONS.map((direction) => (
                    <figure key={direction}>
                      <TrainerPixelSprite
                        animated={false}
                        appearance={appearance}
                        direction={direction}
                        label={`${preview.label} ${direction}`}
                        pose={
                          direction === 'back'
                            ? 'back-relaxed'
                            : 'front-relaxed'
                        }
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
        aria-labelledby="archetype-gallery-title"
      >
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Shared muscular design grammar</p>
            <h2 id="archetype-gallery-title">Every body archetype</h2>
          </div>
          <p>
            Sixteen powerful silhouettes use posture and proportion—not only
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
            <p className="asset-debug-kicker">Pose vocabulary coverage</p>
            <h2 id="animation-gallery-title">Bodybuilding pose library</h2>
          </div>
          <p>
            Every supported movement, gameplay, and bodybuilding pose keeps the
            same bottom-center anchor and crisp nearest-neighbor pixels.
          </p>
        </div>
        <div className="character-animation-gallery" data-gallery="pose-matrix">
          {TRAINER_POSE_DEFINITIONS.map((pose) => (
            <figure key={pose.id} data-pose-category={pose.category}>
              <TrainerPixelSprite
                animated={false}
                appearance={trainerAppearanceFromCharacterDesign(
                  RIVAL_CHARACTER_DESIGNS[1]!,
                )}
                direction={pose.defaultDirection}
                label={`${pose.label} pose`}
                pose={pose.id}
                reducedMotion
                scale={2}
              />
              <figcaption>
                {pose.label}
                <small>{pose.silhouetteCue}</small>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section
        className="asset-debug-section"
        aria-labelledby="clothing-stress-gallery-title"
      >
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Modular attachment validation</p>
            <h2 id="clothing-stress-gallery-title">Clothing stress tests</h2>
          </div>
          <p>
            Every top module is paired with a bottoms module on both minimum
            and maximum builds, alternating light and dark skin tones.
          </p>
        </div>
        <div className="clothing-stress-gallery" data-gallery="clothing-stress">
          {TRAINER_TOPS.map((top, index) => {
            const bottoms = TRAINER_BOTTOMS[index % TRAINER_BOTTOMS.length]!;
            return (
              <article key={top.id}>
                <h3>
                  {top.label} · {bottoms.label}
                </h3>
                <div>
                  {BODY_RANGE_PREVIEWS.filter(
                    (preview) => preview.id !== 'middle',
                  ).map((preview, previewIndex) => {
                    const appearance = trainerAppearanceAtBuild(
                      preview.value,
                      previewIndex === 0
                        ? TRAINER_SKIN_TONES[1]!.id
                        : TRAINER_SKIN_TONES[9]!.id,
                    );
                    appearance.outfit.topId = top.id;
                    appearance.outfit.bottomsId = bottoms.id;
                    appearance.outfit.wristWrapsId = 'double';
                    appearance.outfit.kneeSleevesId = 'reinforced';
                    appearance.accessories.beltId = 'lifting-wide';
                    return (
                      <figure key={preview.id}>
                        <TrainerPixelSprite
                          animated={false}
                          appearance={appearance}
                          direction={index % 2 === 0 ? 'front' : 'back'}
                          label={`${top.label} ${preview.label}`}
                          pose={
                            index % 2 === 0
                              ? 'front-double-biceps'
                              : 'back-double-biceps'
                          }
                          reducedMotion
                          scale={2}
                        />
                        <figcaption>{preview.label}</figcaption>
                      </figure>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="asset-debug-section"
        aria-labelledby="mobile-character-preview-title"
      >
        <div className="asset-debug-section-heading">
          <div>
            <p className="asset-debug-kicker">Handheld readability</p>
            <h2 id="mobile-character-preview-title">
              240×160 mobile-scale preview
            </h2>
          </div>
          <p>
            Native-scale sprites are staged inside the logical playfield to
            verify that mass, taper, limb separation, and posing survive on phones.
          </p>
        </div>
        <div className="mobile-character-preview" data-gallery="mobile-scale">
          {BODY_RANGE_PREVIEWS.map((preview, index) => (
            <figure key={preview.id}>
              <TrainerPixelSprite
                animated={false}
                appearance={trainerAppearanceAtBuild(
                  preview.value,
                  preview.skinToneId,
                )}
                direction={index === 2 ? 'back' : 'front'}
                label={`${preview.label} native scale`}
                pose={
                  index === 0
                    ? 'front-relaxed'
                    : index === 1
                      ? 'side-chest'
                      : 'back-double-biceps'
                }
                reducedMotion
                scale={1}
              />
              <figcaption>{preview.label}</figcaption>
            </figure>
          ))}
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
              <div className="major-character-outfit-pair">
                <TrainerPixelSprite
                  animated={false}
                  appearance={trainerAppearanceFromCharacterDesign(character)}
                  label={`${character.name} signature outfit`}
                  pose={character.signaturePose}
                  reducedMotion
                  scale={2.25}
                />
                <TrainerPixelSprite
                  animated={false}
                  appearance={trainerAppearanceFromCharacterDesign(
                    character,
                    'late-game',
                  )}
                  label={`${character.name} late-game outfit`}
                  pose={character.victoryPose}
                  reducedMotion
                  scale={2.25}
                />
              </div>
              <div>
                <h3>{character.name}</h3>
                <span>
                  {character.kind} · {character.discipline}
                </span>
                <p className="character-physique-line">
                  {MUSCULAR_BODY_ARCHETYPES.find(
                    (archetype) =>
                      archetype.id === character.appearance.archetypeId,
                  )?.label ?? character.appearance.archetypeId}
                  {' · '}
                  {muscleLabel(character.primaryMuscleEmphasis)}
                  {' emphasis'}
                </p>
                <p>{character.trainingPhilosophy}</p>
                <small>
                  {character.signatureClothing} ·{' '}
                  {character.signatureEquipment}
                </small>
                <small>
                  {character.sponsorPatch.label} ·{' '}
                  {character.alternateLateGameOutfit.label}
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
                  {design.physiquePresets.map((preset, presetIndex) => (
                    <figure
                      data-buddy-preset={preset.id}
                      key={preset.id}
                    >
                      <BuddySprite
                        compact
                        cosmetics={{
                          ...design.defaultCosmetics,
                          physiquePresetId: preset.id,
                          physique: preset.physique,
                          bodySizeId: preset.bodySizeId,
                          muscleDefinitionId: preset.muscleDefinitionId,
                          patternId:
                            design.patternOptions[
                              (speciesIndex + presetIndex) %
                                design.patternOptions.length
                            ]!.id,
                          appendageVariantId:
                            design.appendageOptions[
                              presetIndex % design.appendageOptions.length
                            ]!.id,
                          expressionId:
                            design.expressionOptions[
                              (speciesIndex + presetIndex) %
                                design.expressionOptions.length
                            ]!.id as typeof design.defaultCosmetics.expressionId,
                        }}
                        creature={species}
                        direction={
                          CHARACTER_GALLERY_DIRECTIONS[
                            presetIndex % CHARACTER_GALLERY_DIRECTIONS.length
                          ]
                        }
                        label={`${species.name} ${preset.label}`}
                        pose={presetIndex === 3 ? 'front-flex' : 'idle'}
                        reducedMotion
                        scale={2}
                      />
                      <figcaption>{preset.label}</figcaption>
                    </figure>
                  ))}
                </div>
                <div
                  className="buddy-pose-gallery"
                  data-gallery={`buddy-poses-${species.id}`}
                >
                  {BUDDY_POSE_OPTIONS.map((pose, poseIndex) => (
                    <figure data-buddy-pose={pose.id} key={pose.id}>
                      <BuddySprite
                        compact
                        cosmetics={design.defaultCosmetics}
                        creature={species}
                        direction={
                          CHARACTER_GALLERY_DIRECTIONS[
                            poseIndex % CHARACTER_GALLERY_DIRECTIONS.length
                          ]
                        }
                        label={`${species.name} ${pose.label}`}
                        pose={pose.id as BuddyPose}
                        reducedMotion
                        scale={1.4}
                      />
                      <figcaption>{pose.label}</figcaption>
                    </figure>
                  ))}
                </div>
                <div className="buddy-background-checks">
                  {(['light', 'dark'] as const).map((background) => (
                    <figure
                      className={`buddy-background-${background}`}
                      key={background}
                    >
                      <BuddySprite
                        compact
                        cosmetics={{
                          ...design.defaultCosmetics,
                          physiquePresetId:
                            design.physiquePresets.at(-1)!.id,
                          physique: design.physiquePresets.at(-1)!.physique,
                          bodySizeId:
                            design.physiquePresets.at(-1)!.bodySizeId,
                        }}
                        creature={species}
                        label={`${species.name} silhouette on ${background}`}
                        pose="front-flex"
                        reducedMotion
                        scale={1.2}
                        silhouetteOnly
                      />
                      <figcaption>{background}</figcaption>
                    </figure>
                  ))}
                  <figure className="buddy-mobile-check">
                    <BuddySprite
                      compact
                      cosmetics={design.defaultCosmetics}
                      creature={species}
                      label={`${species.name} mobile size`}
                      pose="idle"
                      reducedMotion
                      scale={1}
                    />
                    <figcaption>mobile</figcaption>
                  </figure>
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
                <div className="boss-tier-gallery">
                  {design.presentationTiers.map((tier) => (
                    <figure data-boss-tier={tier.tier} key={tier.id}>
                      <BuddySprite
                        animationCueId={design.entranceAnimationId}
                        animated={false}
                        bossId={boss.id}
                        bossTier={tier.tier}
                        cosmetics={bossBuddyCosmetics(design, tier.tier)}
                        creature={species}
                        label={`${boss.name} ${tier.label}`}
                        pose={tier.poseId}
                        presentationContext="showcase"
                        reducedMotion
                        scale={1}
                        showcasePose={
                          tier.tier === 'defeated'
                            ? 'fatigue-pose'
                            : tier.tier === 'final-round'
                              ? 'most-muscular'
                              : 'front-relaxed'
                        }
                      />
                      <figcaption>{tier.label}</figcaption>
                    </figure>
                  ))}
                </div>
                <div>
                  <h3>{boss.name}</h3>
                  <span>{design.buildLabel}</span>
                  <p className="character-physique-line">
                    {design.primaryMuscleEmphasis} emphasis
                  </p>
                  <p>{design.trainingPhilosophy}</p>
                  <small>{design.battleStance}</small>
                  <small>
                    {design.presentationTiers
                      .map((tier) => tier.equipmentCue)
                      .join(' · ')}
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
