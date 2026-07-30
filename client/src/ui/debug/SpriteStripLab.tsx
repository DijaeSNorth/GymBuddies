import { useMemo, useState } from 'react';

import {
  renderResolvedBuddySprite,
} from '../../game/assets/buddySpriteCompositor';
import {
  getBuddyPresentationImageCacheStats,
} from '../../game/assets/buddyPresentationCompositor';
import type {
  ResolvedBuddyPresentationFrame,
} from '../../game/assets/buddyPresentationResolver';
import {
  resolveBuddySpriteFrame,
  type BuddySpriteRendererPreference,
  type ResolvedBuddySpriteFrame,
} from '../../game/assets/buddySpriteResolver';
import {
  ASSET_MANIFEST,
  getBuddySpriteProfile,
} from '../../game/assets/manifest';
import {
  BUDDY_SPRITE_DIRECTIONS,
  BUDDY_BATTLE_POSES,
  BUDDY_PRESENTATION_CONTEXTS,
  BUDDY_SHOWCASE_POSES,
  BUDDY_SPRITE_LAYERS,
  BUDDY_SPRITE_POSES,
  type BuddySpriteDirection,
  type BuddyBattlePose,
  type BuddyPresentationContext,
  type BuddyShowcasePose,
  type BuddySpriteLayer,
  type BuddySpritePose,
} from '../../game/assets/types';
import { getBuddyAnatomyFamily } from '../../game/assets/anatomyFamilies';
import { getBuddyCharacterDesign } from '../../game/content/buddyCharacters';
import { BUDDY_SPECIES } from '../../game/content/buddies';
import type { BuddyCosmetics } from '../../game/types';
import { BuddySprite } from '../buddies/BuddySprite';
import './spriteStripLab.css';

const PREVIEW_SCALES = [1, 2, 4, 6] as const;
const BACKGROUNDS = [
  'checker',
  'light',
  'dark',
  'route',
  'gym',
  'battle',
] as const;

function cosmeticsForPreset(
  speciesId: string,
  presetId: string,
): BuddyCosmetics {
  const design = getBuddyCharacterDesign(speciesId);
  const preset =
    design.physiquePresets.find((entry) => entry.id === presetId) ??
    design.physiquePresets[0]!;
  return {
    ...design.defaultCosmetics,
    physiquePresetId: preset.id,
    physique: { ...preset.physique },
    bodySizeId: preset.bodySizeId,
    muscleDefinitionId: preset.muscleDefinitionId,
    accessoryIds: [...design.defaultCosmetics.accessoryIds],
  };
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export function SpriteStripLab() {
  const [speciesId, setSpeciesId] = useState('brawny-bear');
  const design = getBuddyCharacterDesign(speciesId);
  const species = BUDDY_SPECIES.find((entry) => entry.id === speciesId)!;
  const profile = getBuddySpriteProfile(speciesId)!;
  const availableBossId =
    speciesId === 'brawny-bear'
      ? 'home-watchman'
      : speciesId === 'ripped-rhino'
        ? 'a-rhino'
        : undefined;
  const [presetId, setPresetId] = useState(
    design.physiquePresets[1]?.id ?? design.physiquePresets[0]!.id,
  );
  const [direction, setDirection] =
    useState<BuddySpriteDirection>('front');
  const [pose, setPose] = useState<BuddySpritePose>('idle');
  const [rendererPreference, setRendererPreference] =
    useState<BuddySpriteRendererPreference>('auto');
  const [presentationContext, setPresentationContext] =
    useState<BuddyPresentationContext>('overworld');
  const [battlePose, setBattlePose] =
    useState<BuddyBattlePose>('neutral-battle');
  const [showcasePose, setShowcasePose] =
    useState<BuddyShowcasePose>('front-relaxed');
  const [useBossProfile, setUseBossProfile] = useState(false);
  const [scale, setScale] = useState<(typeof PREVIEW_SCALES)[number]>(4);
  const [background, setBackground] =
    useState<(typeof BACKGROUNDS)[number]>('checker');
  const [compare, setCompare] = useState(true);
  const [silhouetteOnly, setSilhouetteOnly] = useState(false);
  const [showAnchor, setShowAnchor] = useState(true);
  const [showBounds, setShowBounds] = useState(true);
  const [resolved, setResolved] =
    useState<ResolvedBuddyPresentationFrame>();
  const [, setReceiptRefresh] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [enabledLayers, setEnabledLayers] = useState<
    Record<BuddySpriteLayer, boolean>
  >(() =>
    Object.fromEntries(
      BUDDY_SPRITE_LAYERS.map((layer) => [layer, true]),
    ) as Record<BuddySpriteLayer, boolean>,
  );

  const cosmetics = useMemo(
    () => cosmeticsForPreset(speciesId, presetId),
    [presetId, speciesId],
  );
  const visibleLayers = useMemo(
    () => BUDDY_SPRITE_LAYERS.filter((layer) => enabledLayers[layer]),
    [enabledLayers],
  );
  const anatomy = getBuddyAnatomyFamily(profile.anatomyFamilyId);
  const frameSize = resolved?.frameWidth ?? 24;
  const cacheStats = getBuddyPresentationImageCacheStats();

  function changeSpecies(nextSpeciesId: string) {
    const nextDesign = getBuddyCharacterDesign(nextSpeciesId);
    setSpeciesId(nextSpeciesId);
    setPresetId(
      nextDesign.physiquePresets[1]?.id ??
        nextDesign.physiquePresets[0]!.id,
    );
    setUseBossProfile(false);
  }

  async function exportContactSheet() {
    setExporting(true);
    try {
      const spriteScale = 4;
      const cellWidth = 112;
      const cellHeight = 128;
      const columns = 6;
      const rows = Math.ceil(BUDDY_SPRITE_POSES.length / columns);
      const sheet = document.createElement('canvas');
      sheet.width = columns * cellWidth;
      sheet.height = rows * cellHeight;
      const sheetContext = sheet.getContext('2d');
      if (!sheetContext) return;
      sheetContext.imageSmoothingEnabled = false;
      sheetContext.fillStyle = '#061519';
      sheetContext.fillRect(0, 0, sheet.width, sheet.height);
      sheetContext.font = '10px monospace';
      sheetContext.textAlign = 'center';

      for (let index = 0; index < BUDDY_SPRITE_POSES.length; index += 1) {
        const contactPose = BUDDY_SPRITE_POSES[index]!;
        const resolution = resolveBuddySpriteFrame({
          speciesId,
          direction,
          pose: contactPose,
          animationFrame: 0,
          rendererPreference,
        });
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = 24;
        frameCanvas.height = 24;
        const frameContext = frameCanvas.getContext('2d', {
          willReadFrequently: true,
        });
        if (!frameContext) continue;
        await renderResolvedBuddySprite({
          context: frameContext,
          resolution,
          species,
          cosmetics,
          visibleLayers: new Set(visibleLayers),
        });
        const column = index % columns;
        const row = Math.floor(index / columns);
        const left = column * cellWidth;
        const top = row * cellHeight;
        sheetContext.fillStyle =
          (column + row) % 2 === 0 ? '#0c2b2f' : '#102f35';
        sheetContext.fillRect(left, top, cellWidth, cellHeight);
        sheetContext.drawImage(
          frameCanvas,
          left + (cellWidth - 24 * spriteScale) / 2,
          top + 8,
          24 * spriteScale,
          24 * spriteScale,
        );
        sheetContext.fillStyle = '#eef2d0';
        sheetContext.fillText(
          contactPose,
          left + cellWidth / 2,
          top + 116,
        );
      }
      downloadCanvas(
        sheet,
        `${speciesId}-${direction}-${rendererPreference}-review.png`,
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="sprite-lab">
      <header className="sprite-lab__header">
        <div>
          <p>Development tool · sprite pipeline v{ASSET_MANIFEST.buddySpritePipeline.version}</p>
          <h1>Sprite Strip Lab</h1>
          <span>
            Inspect authored bases, procedural overlays, anchors, frames, and
            fallback behavior without changing save data.
          </span>
        </div>
        <nav aria-label="Debug navigation">
          <a href="?debug=assets">Asset deck</a>
          <a href="./">Game</a>
        </nav>
      </header>

      <section className="sprite-lab__controls" aria-label="Sprite controls">
        <label>
          Species
          <select
            value={speciesId}
            onChange={(event) => changeSpecies(event.target.value)}
          >
            {BUDDY_SPECIES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name} · {entry.id}
              </option>
            ))}
          </select>
        </label>
        <label>
          Physique preset
          <select
            value={presetId}
            onChange={(event) => setPresetId(event.target.value)}
          >
            {design.physiquePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Context
          <select
            aria-label="Presentation context"
            value={presentationContext}
            onChange={(event) =>
              setPresentationContext(
                event.target.value as BuddyPresentationContext,
              )
            }
          >
            {BUDDY_PRESENTATION_CONTEXTS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        {presentationContext === 'battle' ? (
          <label>
            Battle pose
            <select
              aria-label="Battle pose"
              value={battlePose}
              onChange={(event) =>
                setBattlePose(event.target.value as BuddyBattlePose)
              }
            >
              {BUDDY_BATTLE_POSES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {presentationContext === 'showcase' ? (
          <label>
            Showcase pose
            <select
              aria-label="Showcase pose"
              value={showcasePose}
              onChange={(event) =>
                setShowcasePose(
                  event.target.value as BuddyShowcasePose,
                )
              }
            >
              {BUDDY_SHOWCASE_POSES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label>
          Pose
          <select
            value={pose}
            onChange={(event) =>
              setPose(event.target.value as BuddySpritePose)
            }
          >
            {BUDDY_SPRITE_POSES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        {availableBossId ? (
          <label className="sprite-lab__checkbox-control">
            <input
              checked={useBossProfile}
              onChange={(event) =>
                setUseBossProfile(event.target.checked)
              }
              type="checkbox"
            />
            {availableBossId === 'home-watchman'
              ? 'Mat Watchman profile'
              : 'A-Rhino profile'}
          </label>
        ) : null}
        <label>
          Direction
          <select
            value={direction}
            onChange={(event) =>
              setDirection(event.target.value as BuddySpriteDirection)
            }
          >
            {BUDDY_SPRITE_DIRECTIONS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        <label>
          Renderer
          <select
            value={rendererPreference}
            onChange={(event) =>
              setRendererPreference(
                event.target.value as BuddySpriteRendererPreference,
              )
            }
          >
            <option value="auto">Auto · manifest</option>
            <option value="procedural">Procedural only</option>
            <option value="authored">Prefer authored</option>
          </select>
        </label>
        <label>
          Background
          <select
            value={background}
            onChange={(event) =>
              setBackground(
                event.target.value as (typeof BACKGROUNDS)[number],
              )
            }
          >
            {BACKGROUNDS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="sprite-lab__workspace">
        <aside className="sprite-lab__layers">
          <h2>Layer groups</h2>
          {BUDDY_SPRITE_LAYERS.map((layer) => (
            <label key={layer}>
              <input
                checked={enabledLayers[layer]}
                onChange={(event) =>
                  setEnabledLayers((current) => ({
                    ...current,
                    [layer]: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              {layer}
            </label>
          ))}
          <div className="sprite-lab__toggles">
            <label>
              <input
                checked={showAnchor}
                onChange={(event) => setShowAnchor(event.target.checked)}
                type="checkbox"
              />
              anchor overlay
            </label>
            <label>
              <input
                checked={showBounds}
                onChange={(event) => setShowBounds(event.target.checked)}
                type="checkbox"
              />
              frame bounds
            </label>
            <label>
              <input
                checked={compare}
                onChange={(event) => setCompare(event.target.checked)}
                type="checkbox"
              />
              compare renderers
            </label>
            <label>
              <input
                checked={silhouetteOnly}
                onChange={(event) => setSilhouetteOnly(event.target.checked)}
                type="checkbox"
              />
              silhouette only
            </label>
          </div>
        </aside>

        <div className="sprite-lab__preview-column">
          <div className="sprite-lab__scale" aria-label="Preview scale">
            {PREVIEW_SCALES.map((entry) => (
              <button
                aria-pressed={scale === entry}
                key={entry}
                onClick={() => setScale(entry)}
                type="button"
              >
                {entry}×
              </button>
            ))}
          </div>
          <div
            className={`sprite-lab__stage background-${background}${
              showBounds ? ' show-bounds' : ''
            }${showAnchor ? ' show-anchor' : ''}`}
            style={{
              '--anchor-x': `${anatomy.pivot.x * scale}px`,
              '--anchor-y': `${anatomy.pivot.y * scale}px`,
              '--frame-size': `${frameSize * scale}px`,
            } as React.CSSProperties}
          >
            <BuddySprite
              animated
              battlePose={battlePose}
              bossId={useBossProfile ? availableBossId : undefined}
              bossTier={useBossProfile ? 'final-round' : undefined}
              cosmetics={cosmetics}
              creature={species}
              direction={direction}
              onPresentationResolution={setResolved}
              pose={pose}
              presentationContext={presentationContext}
              rendererPreference={rendererPreference}
              scale={scale}
              showcasePose={showcasePose}
              silhouetteOnly={silhouetteOnly}
              visibleLayers={visibleLayers}
            />
          </div>

          {compare ? (
            <div className="sprite-lab__compare" data-testid="sprite-renderer-comparison">
              <figure>
                <BuddySprite
                  battlePose={battlePose}
                  bossId={useBossProfile ? availableBossId : undefined}
                  cosmetics={cosmetics}
                  creature={species}
                  direction={direction}
                  pose={pose}
                  presentationContext={presentationContext}
                  reducedMotion
                  rendererPreference="procedural"
                  scale={2}
                  showcasePose={showcasePose}
                  silhouetteOnly={silhouetteOnly}
                  visibleLayers={visibleLayers}
                />
                <figcaption>Procedural baseline</figcaption>
              </figure>
              <figure>
                <BuddySprite
                  battlePose={battlePose}
                  bossId={useBossProfile ? availableBossId : undefined}
                  cosmetics={cosmetics}
                  creature={species}
                  direction={direction}
                  pose={pose}
                  presentationContext={presentationContext}
                  reducedMotion
                  rendererPreference="authored"
                  scale={2}
                  showcasePose={showcasePose}
                  silhouetteOnly={silhouetteOnly}
                  visibleLayers={visibleLayers}
                />
                <figcaption>Authored / fallback</figcaption>
              </figure>
            </div>
          ) : null}
        </div>

        <aside className="sprite-lab__receipt">
          <h2>Resolution receipt</h2>
          <dl>
            <div>
              <dt>Requested context</dt>
              <dd>{resolved?.requestedContext ?? presentationContext}</dd>
            </div>
            <div>
              <dt>Selected context</dt>
              <dd>{resolved?.selectedContext ?? 'loading'}</dd>
            </div>
            <div>
              <dt>Manifest mode</dt>
              <dd>{profile.rendererMode}</dd>
            </div>
            <div>
              <dt>Resolved base</dt>
              <dd>{resolved?.source ?? 'loading'}</dd>
            </div>
            <div>
              <dt>Asset status</dt>
              <dd>{resolved?.assetStatus ?? 'procedural'}</dd>
            </div>
            <div>
              <dt>Asset version</dt>
              <dd>{resolved?.assetVersion ?? 'n/a'}</dd>
            </div>
            <div>
              <dt>Anatomy</dt>
              <dd>{profile.anatomyFamilyId}</dd>
            </div>
            <div>
              <dt>Source direction</dt>
              <dd>{direction}</dd>
            </div>
            <div>
              <dt>Mirrored</dt>
              <dd>
                {resolved?.overworldFrame?.mirrorX ? 'yes' : 'no'}
              </dd>
            </div>
            <div>
              <dt>Frame</dt>
              <dd>{resolved?.sourceFrame ?? 0}</dd>
            </div>
            <div>
              <dt>Native frame</dt>
              <dd>
                {resolved?.frameWidth ?? 24}×
                {resolved?.frameHeight ?? 24}
              </dd>
            </div>
            <div>
              <dt>Load group</dt>
              <dd>{resolved?.loadGroup ?? 'core'}</dd>
            </div>
            <div>
              <dt>Decoded cache</dt>
              <dd>
                {cacheStats.entries}/{cacheStats.entryLimit} entries ·{' '}
                {Math.round(cacheStats.decodedBytes / 1024)} KiB /{' '}
                {Math.round(cacheStats.byteLimit / 1024)} KiB
              </dd>
            </div>
            <div>
              <dt>Anchor</dt>
              <dd>
                {anatomy.pivot.x}, {anatomy.pivot.y}
              </dd>
            </div>
            <div>
              <dt>Ground</dt>
              <dd>{anatomy.groundLineY}px</dd>
            </div>
          </dl>
          {resolved?.fallbackReason ? (
            <p role="status">Fallback: {resolved.fallbackReason}</p>
          ) : null}
          <button
            onClick={() => setReceiptRefresh((value) => value + 1)}
            type="button"
          >
            Refresh memory receipt
          </button>
          <button
            disabled={exporting}
            onClick={() => void exportContactSheet()}
            type="button"
          >
            {exporting ? 'Rendering review…' : 'Export review contact sheet'}
          </button>
        </aside>
      </section>
    </main>
  );
}
