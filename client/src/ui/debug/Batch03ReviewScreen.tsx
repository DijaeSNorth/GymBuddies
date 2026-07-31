import { useEffect, useMemo, useRef } from 'react';

import {
  BATCH_03_ANATOMY_PROFILES,
  BATCH_03_BOSS_TIER_RULES,
  PLASTRONG_ACCESSORY_MOUNTS,
  PLASTRONG_DOME_LAYER_IDS,
  type PlastrongDomeLayerId,
} from '../../game/assets/domeShellModules';
import {
  PLASTRONG_ACCESSORY_PRIORITY_RULES,
  resolvePlastrongAccessoryPriority,
} from '../../game/assets/accessoryPriority';
import {
  BATCH_03_FORMAL_REVIEW_RECEIPTS,
} from '../../game/assets/batch03FormalReview';
import {
  BUDDY_BATTLE_POSES,
  BUDDY_SHOWCASE_POSES,
} from '../../game/assets/types';
import {
  getBuddyCharacterDesign,
} from '../../game/content/buddyCharacters';
import { getBuddySpeciesById } from '../../game/content/buddies';
import {
  renderDomeShellPixelLayers,
} from '../../game/rendering/domeShellPixelRenderer';
import type {
  BossPresentationTier,
  BuddyCosmetics,
  BuddyFacingDirection,
} from '../../game/types';
import { BuddySprite } from '../buddies/BuddySprite';
import './batch03Review.css';

const DIRECTIONS = ['front', 'back', 'left', 'right'] as const;
const BOSS_TIERS = [
  'normal',
  'pumped',
  'overload',
  'final-round',
  'defeated',
] as const satisfies readonly BossPresentationTier[];
const BACKGROUNDS = [
  'light',
  'dark',
  'gym',
  'route',
  'battle',
] as const;

type ReviewCharacter = Readonly<{
  id:
    | 'titan-tortoise'
    | 'ripped-rhino'
    | 'boulder-bison'
    | 'dome-warden';
  label: string;
  speciesId:
    | 'titan-tortoise'
    | 'ripped-rhino'
    | 'boulder-bison';
  role: string;
  bossId?: 'dome-warden';
}>;

const CHARACTERS: readonly ReviewCharacter[] = [
  {
    id: 'titan-tortoise',
    label: 'Plastrong',
    speciesId: 'titan-tortoise',
    role: 'Complete domed shell',
  },
  {
    id: 'ripped-rhino',
    label: 'Railhorn v3',
    speciesId: 'ripped-rhino',
    role: 'Low-profile armored control',
  },
  {
    id: 'boulder-bison',
    label: 'Cairnox',
    speciesId: 'boulder-bison',
    role: 'Rigid torso over exposed limbs',
  },
  {
    id: 'dome-warden',
    label: 'Dome Warden',
    speciesId: 'titan-tortoise',
    role: 'Plastrong-derived review boss',
    bossId: 'dome-warden',
  },
];

function cosmeticsForPreset(
  speciesId: ReviewCharacter['speciesId'],
  presetId: string,
  pumpEffectId: 'none' | 'full' = 'none',
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
    accessoryIds: [],
  };
}

function reviewCosmetics(
  character: ReviewCharacter,
  tier: BossPresentationTier = 'normal',
) {
  const design = getBuddyCharacterDesign(character.speciesId);
  const preset =
    design.physiquePresets.find((entry) =>
      entry.id.endsWith(
        character.speciesId === 'titan-tortoise'
          ? '-tank'
          : '-balanced',
      ),
    ) ?? design.physiquePresets[1]!;
  return cosmeticsForPreset(
    character.speciesId,
    preset.id,
    tier === 'normal' || tier === 'defeated' ? 'none' : 'full',
  );
}

function Figure({
  children,
  label,
  inspect = false,
}: {
  children: React.ReactNode;
  label: string;
  inspect?: boolean;
}) {
  return (
    <figure className={inspect ? 'batch03-inspect-frame' : undefined}>
      <div className="batch03-sprite-stage">{children}</div>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function DomeLayerCanvas({
  direction = 'front',
  layerId,
  showAll = false,
}: {
  direction?: BuddyFacingDirection;
  layerId?: PlastrongDomeLayerId;
  showAll?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const species = getBuddySpeciesById('titan-tortoise');
  const design = getBuddyCharacterDesign(species.id);
  const cosmetics = cosmeticsForPreset(
    'titan-tortoise',
    design.physiquePresets[1]!.id,
  );
  const inspectionCosmetics = {
    ...cosmetics,
    physique: {
      ...cosmetics.physique,
      pumpEffectId: 'full' as const,
    },
    rareTraitId: 'rare-glow-lines',
  };
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, 24, 24);
    context.imageSmoothingEnabled = false;
    const layers = renderDomeShellPixelLayers(
      species,
      inspectionCosmetics,
      direction,
      'idle',
    );
    if (!layers) return;
    const selected = showAll
      ? PLASTRONG_DOME_LAYER_IDS
      : layerId
        ? [layerId]
        : [];
    selected.forEach((id) => {
      layers[id].forEach((rect) => {
        context.fillStyle = rect.color;
        context.fillRect(rect.x, rect.y, rect.width, rect.height);
      });
    });
  }, [direction, inspectionCosmetics, layerId, showAll, species]);
  return (
    <canvas
      aria-label={layerId ?? 'Complete Plastrong layer composition'}
      className="batch03-layer-canvas"
      height={24}
      ref={canvasRef}
      width={24}
    />
  );
}

function AnchorDiagram({ direction }: { direction: BuddyFacingDirection }) {
  const mounts = PLASTRONG_ACCESSORY_MOUNTS.filter(
    (mount) => mount.direction === direction,
  );
  return (
    <div className="batch03-anchor-diagram">
      <DomeLayerCanvas direction={direction} showAll />
      <svg
        aria-label={`${direction} Plastrong accessory anchors`}
        viewBox="0 0 24 24"
      >
        {mounts.map((mount, index) => (
          <g key={mount.id}>
            <circle
              cx={mount.anchor.x}
              cy={mount.anchor.y}
              fill={index % 2 === 0 ? '#f2c14e' : '#ef6a5b'}
              r="0.65"
              stroke="#061519"
              strokeWidth="0.3"
            />
            <text
              fill="#eef2d0"
              fontSize="1.5"
              x={mount.anchor.x + 0.7}
              y={mount.anchor.y - 0.5}
            >
              {index + 1}
            </text>
          </g>
        ))}
      </svg>
      <ol>
        {mounts.map((mount) => (
          <li key={mount.id}>{mount.accessoryId.split('.').at(-1)}</li>
        ))}
      </ol>
    </div>
  );
}

function CrossResolutionRow({
  character,
}: {
  character: ReviewCharacter;
}) {
  const species = getBuddySpeciesById(character.speciesId);
  const cosmetics = reviewCosmetics(character);
  return (
    <div className="batch03-cross-row" data-cross-character={character.id}>
      <h3>{character.label}</h3>
      {DIRECTIONS.map((direction) => (
        <Figure key={`ow-${direction}`} label={`24×24 ${direction}`}>
          <BuddySprite
            bossId={character.bossId}
            bossTier={character.bossId ? 'normal' : undefined}
            cosmetics={cosmetics}
            creature={species}
            direction={direction}
            presentationContext="overworld"
            reducedMotion
            scale={3}
          />
        </Figure>
      ))}
      <Figure label="32×32 menu">
        <BuddySprite
          bossId={character.bossId}
          bossTier={character.bossId ? 'normal' : undefined}
          cosmetics={cosmetics}
          creature={species}
          presentationContext="menu"
          reducedMotion
          scale={2}
        />
      </Figure>
      <Figure label={character.bossId ? '64×64 battle' : '48×48 battle'}>
        <BuddySprite
          bossId={character.bossId}
          bossTier={character.bossId ? 'normal' : undefined}
          cosmetics={cosmetics}
          creature={species}
          battlePose="neutral-battle"
          presentationContext="battle"
          reducedMotion
          scale={character.bossId ? 1 : 1.35}
        />
      </Figure>
      <Figure label="64×64 showcase">
        <BuddySprite
          bossId={character.bossId}
          bossTier={character.bossId ? 'normal' : undefined}
          cosmetics={cosmetics}
          creature={species}
          presentationContext="showcase"
          reducedMotion
          scale={1}
          showcasePose="front-relaxed"
        />
      </Figure>
      <Figure label="64×64 portrait">
        <BuddySprite
          bossId={character.bossId}
          bossTier={character.bossId ? 'normal' : undefined}
          cosmetics={cosmetics}
          creature={species}
          presentationContext="dialogue"
          reducedMotion
          scale={1}
        />
      </Figure>
    </div>
  );
}

function NativeScaleRow({
  character,
}: {
  character: ReviewCharacter;
}) {
  const species = getBuddySpeciesById(character.speciesId);
  const cosmetics = reviewCosmetics(character);
  return (
    <div className="batch03-native-scale-row">
      <h3>{character.label}</h3>
      {([1, 2, 4] as const).map((scale) => (
        <Figure key={scale} label={`24×24 at ${scale}×`}>
          <BuddySprite
            bossId={character.bossId}
            bossTier={character.bossId ? 'normal' : undefined}
            cosmetics={cosmetics}
            creature={species}
            direction="front"
            presentationContext="overworld"
            reducedMotion
            scale={scale}
          />
        </Figure>
      ))}
    </div>
  );
}

function AccessoryPriorityMatrix() {
  return (
    <div className="batch03-accessory-matrix">
      {PLASTRONG_ACCESSORY_PRIORITY_RULES.map((rule) => (
        <article
          data-accessory-priority={rule.accessoryId}
          key={rule.accessoryId}
        >
          <header>
            <h3>{rule.accessoryId.split('.').at(-1)}</h3>
            <span>
              P{rule.priority} · {rule.slot} ·{' '}
              {rule.overworldPresentation}
            </span>
          </header>
          <div className="batch03-grid batch03-accessory-directions">
            {DIRECTIONS.map((direction) => {
              const resolved = resolvePlastrongAccessoryPriority({
                accessoryIds: [rule.accessoryId],
                context: 'overworld',
                direction,
              })[0]!;
              const mount = PLASTRONG_ACCESSORY_MOUNTS.find(
                (entry) =>
                  entry.accessoryId === rule.accessoryId &&
                  entry.direction === direction,
              )!;
              return (
                <div
                  data-accessory-stress-case={`${rule.accessoryId}.${direction}.overworld`}
                  key={direction}
                >
                  <DomeLayerCanvas direction={direction} showAll />
                  <small>
                    {direction} · {resolved.presentation} · (
                    {mount.anchor.x},{mount.anchor.y})
                  </small>
                </div>
              );
            })}
          </div>
          <p>{rule.reason}</p>
          {(['menu', 'battle', 'showcase', 'dialogue'] as const).map(
            (context) => (
              <span
                className="batch03-context-chip"
                data-accessory-stress-case={`${rule.accessoryId}.front.${context}`}
                key={context}
              >
                {context}: full
              </span>
            ),
          )}
        </article>
      ))}
    </div>
  );
}

function ApprovalLedger() {
  return (
    <div className="batch03-ledger-wrap">
      <table className="batch03-ledger">
        <thead>
          <tr>
            <th>Character</th>
            <th>Profile</th>
            <th>Resolution</th>
            <th>Status</th>
            <th>Alpha</th>
            <th>Reviewer note</th>
            <th>Required correction</th>
          </tr>
        </thead>
        <tbody>
          {BATCH_03_FORMAL_REVIEW_RECEIPTS.map((receipt) => (
            <tr
              data-approval-receipt={receipt.id}
              key={receipt.id}
            >
              <td>{receipt.characterId}</td>
              <td>{receipt.profile}</td>
              <td>{receipt.authoredResolution}</td>
              <td data-status={receipt.status}>{receipt.status}</td>
              <td>{receipt.mayShipInAlpha ? 'yes' : 'no'}</td>
              <td>{receipt.reviewerNote}</td>
              <td>{receipt.requiredCorrection}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CharacterContactSheet({
  character,
}: {
  character: ReviewCharacter;
}) {
  const species = getBuddySpeciesById(character.speciesId);
  const design = getBuddyCharacterDesign(character.speciesId);
  const cosmetics = reviewCosmetics(character);
  const pumped = {
    ...cosmetics,
    physique: { ...cosmetics.physique, pumpEffectId: 'full' as const },
  };
  const isBoss = Boolean(character.bossId);
  const profile = BATCH_03_ANATOMY_PROFILES.find(
    (entry) => entry.speciesId === character.speciesId,
  )!;
  const presetLabels = design.physiquePresets.map((preset, index) =>
    index === 4 ? profile.speciesSpecificPresetLabel : preset.label,
  );

  return (
    <article
      className="batch03-contact-sheet"
      data-batch03-character={character.id}
    >
      <header>
        <p>Handcrafted Batch 03 · review only · asset v3.0.0</p>
        <h1>{character.label}</h1>
        <span>{character.role}</span>
      </header>

      <section>
        <h2>Cross-resolution identity</h2>
        <CrossResolutionRow character={character} />
      </section>

      <section>
        <h2>Four directions and five physiques</h2>
        <div className="batch03-preset-grid">
          {design.physiquePresets.map((preset, index) => (
            <div data-batch03-preset={preset.id} key={preset.id}>
              <h3>{presetLabels[index]}</h3>
              <div className="batch03-grid batch03-directions">
                {DIRECTIONS.map((direction) => (
                  <Figure key={direction} label={direction}>
                    <BuddySprite
                      bossId={character.bossId}
                      bossTier={isBoss ? 'normal' : undefined}
                      cosmetics={cosmeticsForPreset(
                        character.speciesId,
                        preset.id,
                      )}
                      creature={species}
                      direction={direction}
                      presentationContext="overworld"
                      reducedMotion
                      scale={3}
                    />
                  </Figure>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Neutral, pumped, and fatigue</h2>
        <div className="batch03-grid batch03-state-grid">
          <Figure label="Neutral">
            <BuddySprite
              bossId={character.bossId}
              bossTier={isBoss ? 'normal' : undefined}
              cosmetics={cosmetics}
              creature={species}
              battlePose="neutral-battle"
              presentationContext="battle"
              reducedMotion
              scale={isBoss ? 1 : 1.35}
            />
          </Figure>
          <Figure label="Pumped">
            <BuddySprite
              bossId={character.bossId}
              bossTier={isBoss ? 'pumped' : undefined}
              cosmetics={pumped}
              creature={species}
              battlePose="neutral-battle"
              presentationContext="battle"
              reducedMotion
              scale={isBoss ? 1 : 1.35}
            />
          </Figure>
          <Figure label="Fatigue">
            <BuddySprite
              bossId={character.bossId}
              bossTier={isBoss ? 'defeated' : undefined}
              cosmetics={cosmetics}
              creature={species}
              battlePose="defeat"
              presentationContext="battle"
              reducedMotion
              scale={isBoss ? 1 : 1.35}
            />
          </Figure>
        </div>
      </section>

      <section>
        <h2>Authored battle actions</h2>
        <div className="batch03-grid batch03-action-grid">
          {BUDDY_BATTLE_POSES.map((battlePose) => (
            <Figure key={battlePose} label={battlePose}>
              <BuddySprite
                bossId={character.bossId}
                bossTier={isBoss ? 'normal' : undefined}
                cosmetics={cosmetics}
                creature={species}
                battlePose={battlePose}
                presentationContext="battle"
                reducedMotion
                scale={isBoss ? 1 : 1.2}
              />
            </Figure>
          ))}
        </div>
      </section>

      <section>
        <h2>Showcase poses</h2>
        <div className="batch03-grid batch03-action-grid">
          {BUDDY_SHOWCASE_POSES.map((showcasePose) => (
            <Figure key={showcasePose} label={showcasePose}>
              <BuddySprite
                bossId={character.bossId}
                bossTier={isBoss ? 'normal' : undefined}
                cosmetics={cosmetics}
                creature={species}
                presentationContext="showcase"
                reducedMotion
                scale={1}
                showcasePose={showcasePose}
              />
            </Figure>
          ))}
        </div>
      </section>

      <section>
        <h2>Background and mobile readability</h2>
        <div className="batch03-grid batch03-background-grid">
          {BACKGROUNDS.map((background) => (
            <Figure key={background} label={background}>
              <div className={`batch03-background is-${background}`}>
                <BuddySprite
                  bossId={character.bossId}
                  bossTier={isBoss ? 'pumped' : undefined}
                  cosmetics={pumped}
                  creature={species}
                  battlePose="iron-grind"
                  presentationContext="battle"
                  reducedMotion
                  scale={isBoss ? 1 : 1.2}
                />
              </div>
            </Figure>
          ))}
          <Figure label="390×844 native-scale preview">
            <div className="batch03-mobile-card">
              <BuddySprite
                bossId={character.bossId}
                bossTier={isBoss ? 'normal' : undefined}
                cosmetics={cosmetics}
                creature={species}
                battlePose="neutral-battle"
                presentationContext="battle"
                reducedMotion
                scale={1}
              />
              <strong>{character.label}</strong>
              <span>{character.role}</span>
            </div>
          </Figure>
          <Figure label="Silhouette only">
            <BuddySprite
              bossId={character.bossId}
              bossTier={isBoss ? 'normal' : undefined}
              cosmetics={cosmetics}
              creature={species}
              presentationContext="showcase"
              reducedMotion
              scale={1}
              showcasePose="front-relaxed"
              silhouetteOnly
            />
          </Figure>
          <Figure inspect label="Anchor and frame bounds">
            <BuddySprite
              bossId={character.bossId}
              bossTier={isBoss ? 'normal' : undefined}
              cosmetics={cosmetics}
              creature={species}
              battlePose="near-pin"
              presentationContext="battle"
              reducedMotion
              scale={isBoss ? 1 : 1.2}
            />
          </Figure>
        </div>
      </section>
    </article>
  );
}

export function Batch03ReviewScreen() {
  const plastrong = useMemo(
    () => CHARACTERS.find((entry) => entry.id === 'titan-tortoise')!,
    [],
  );
  const species = getBuddySpeciesById(plastrong.speciesId);

  return (
    <main className="batch03-review-shell">
      <nav>
        <a href="?debug=batch02-review">Batch 02 Gate</a>
        <a href="?debug=sprites">Sprite Lab</a>
        <a href="./">Game</a>
      </nav>

      <section
        className="batch03-deliverable"
        data-review-deliverable="cross-resolution"
      >
        <header>
          <p>Batch 03 deliverable</p>
          <h1>Cross-resolution comparison</h1>
        </header>
        {CHARACTERS.map((character) => (
          <CrossResolutionRow
            character={character}
            key={character.id}
          />
        ))}
      </section>

      <section
        className="batch03-deliverable"
        data-review-deliverable="native-scales"
      >
        <header>
          <p>Formal Batch 03 gate</p>
          <h1>Native 1×, 2×, and 4× overworld inspection</h1>
        </header>
        {CHARACTERS.map((character) => (
          <NativeScaleRow character={character} key={character.id} />
        ))}
      </section>

      <section
        className="batch03-deliverable"
        data-review-deliverable="silhouettes"
      >
        <header>
          <p>Batch 03 deliverable</p>
          <h1>Four-direction silhouette sheet</h1>
        </header>
        {CHARACTERS.map((character) => {
          const creature = getBuddySpeciesById(character.speciesId);
          const cosmetics = reviewCosmetics(character);
          return (
            <div className="batch03-silhouette-row" key={character.id}>
              <h2>{character.label}</h2>
              {DIRECTIONS.map((direction) => (
                <Figure key={direction} label={direction}>
                  <BuddySprite
                    bossId={character.bossId}
                    bossTier={character.bossId ? 'normal' : undefined}
                    cosmetics={cosmetics}
                    creature={creature}
                    direction={direction}
                    presentationContext="menu"
                    reducedMotion
                    scale={2}
                    silhouetteOnly
                  />
                </Figure>
              ))}
            </div>
          );
        })}
      </section>

      <section
        className="batch03-deliverable"
        data-review-deliverable="armor-layers"
      >
        <header>
          <p>Batch 03 deliverable</p>
          <h1>Plastrong armor-layer isolation</h1>
        </header>
        <div className="batch03-grid batch03-layer-grid">
          {PLASTRONG_DOME_LAYER_IDS.map((layerId) => (
            <Figure key={layerId} label={layerId}>
              <DomeLayerCanvas layerId={layerId} />
            </Figure>
          ))}
          <Figure label="complete composition">
            <DomeLayerCanvas showAll />
          </Figure>
        </div>
      </section>

      <section
        className="batch03-deliverable"
        data-review-deliverable="anchors"
      >
        <header>
          <p>Batch 03 deliverable</p>
          <h1>Plastrong explicit accessory anchors</h1>
        </header>
        <div className="batch03-grid batch03-anchor-grid">
          {DIRECTIONS.map((direction) => (
            <div key={direction}>
              <h2>{direction}</h2>
              <AnchorDiagram direction={direction} />
            </div>
          ))}
        </div>
      </section>

      <section
        className="batch03-deliverable"
        data-review-deliverable="accessory-priority"
      >
        <header>
          <p>Formal Batch 03 gate</p>
          <h1>Plastrong accessory priority and all 32 mount points</h1>
          <span>
            This is an anchor-and-density inspection. Final accessory pixels
            remain an art correction, not an automatic approval.
          </span>
        </header>
        <AccessoryPriorityMatrix />
      </section>

      <section
        className="batch03-deliverable"
        data-review-deliverable="mobile"
      >
        <header>
          <p>Batch 03 deliverable</p>
          <h1>390×844 mobile preview</h1>
        </header>
        <div className="batch03-grid batch03-mobile-grid">
          {CHARACTERS.map((character) => (
            <div className="batch03-mobile-card" key={character.id}>
              <BuddySprite
                bossId={character.bossId}
                bossTier={character.bossId ? 'normal' : undefined}
                cosmetics={reviewCosmetics(character)}
                creature={getBuddySpeciesById(character.speciesId)}
                battlePose="neutral-battle"
                presentationContext="battle"
                reducedMotion
                scale={1}
              />
              <strong>{character.label}</strong>
              <span>{character.role}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        className="batch03-deliverable"
        data-review-deliverable="boss-tiers"
      >
        <header>
          <p>Batch 03 deliverable</p>
          <h1>Dome Warden boss-tier comparison</h1>
        </header>
        <div className="batch03-grid batch03-tier-grid">
          {BOSS_TIERS.map((tier) => (
            <div data-batch03-boss-tier={tier} key={tier}>
              <h2>{tier}</h2>
              <Figure label="battle">
                <BuddySprite
                  bossId="dome-warden"
                  bossTier={tier}
                  cosmetics={reviewCosmetics(
                    CHARACTERS[3]!,
                    tier,
                  )}
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
              </Figure>
              <Figure label="showcase">
                <BuddySprite
                  bossId="dome-warden"
                  bossTier={tier}
                  cosmetics={reviewCosmetics(
                    CHARACTERS[3]!,
                    tier,
                  )}
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
              </Figure>
              <dl>
                <div>
                  <dt>Shell scale</dt>
                  <dd>{BATCH_03_BOSS_TIER_RULES[tier].shellScale}</dd>
                </div>
                <div>
                  <dt>Seam light</dt>
                  <dd>{BATCH_03_BOSS_TIER_RULES[tier].seamLight}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section
        className="batch03-deliverable"
        data-review-deliverable="formal-ledger"
      >
        <header>
          <p>Formal Batch 03 gate · reviewed 2026-07-30</p>
          <h1>Resolution-specific approval ledger</h1>
          <span>
            No Batch 03 profile is approved or final. Review profiles may be
            used in alpha only where the ledger explicitly says yes.
          </span>
        </header>
        <ApprovalLedger />
      </section>

      {CHARACTERS.map((character) => (
        <CharacterContactSheet
          character={character}
          key={character.id}
        />
      ))}
    </main>
  );
}
