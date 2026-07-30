import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  releaseBuddyPresentationImage,
  renderResolvedBuddyPresentation,
} from '../../game/assets/buddyPresentationCompositor';
import {
  resolveReactBuddyPresentationFrame,
  type ResolvedBuddyPresentationFrame,
} from '../../game/assets/buddyPresentationResolver';
import {
  BUDDY_PIXEL_HEIGHT,
  BUDDY_PIXEL_WIDTH,
} from '../../game/rendering/buddyPixelRenderer';
import {
  renderResolvedBuddySprite,
} from '../../game/assets/buddySpriteCompositor';
import {
  resolveReactBuddySpriteFrame,
  type BuddySpriteRendererPreference,
  type ResolvedBuddySpriteFrame,
} from '../../game/assets/buddySpriteResolver';
import type {
  BuddyBattlePose,
  BuddyPresentationContext,
  BuddyShowcasePose,
  BuddySpriteLayer,
} from '../../game/assets/types';
import type {
  BossPresentationTier,
  BuddyCosmetics,
  BuddyFacingDirection,
  BuddyPose,
  BuddySpecies,
} from '../../game/types';

type BuddySpriteProps = {
  animationCueId?: string;
  animated?: boolean;
  compact?: boolean;
  cosmetics?: Partial<BuddyCosmetics> | null;
  creature: BuddySpecies;
  direction?: BuddyFacingDirection;
  label?: string;
  pose?: BuddyPose;
  reducedMotion?: boolean;
  rendererPreference?: BuddySpriteRendererPreference;
  scale?: number;
  silhouetteOnly?: boolean;
  bossId?: string;
  bossTier?: BossPresentationTier;
  presentationContext?: BuddyPresentationContext;
  battlePose?: BuddyBattlePose;
  showcasePose?: BuddyShowcasePose;
  onResolution?: (resolution: ResolvedBuddySpriteFrame) => void;
  onPresentationResolution?: (
    resolution: ResolvedBuddyPresentationFrame,
  ) => void;
  visibleLayers?: readonly BuddySpriteLayer[];
};

export function BuddySprite({
  animationCueId,
  animated = false,
  compact = false,
  cosmetics,
  creature,
  direction = 'front',
  label,
  pose = 'idle',
  reducedMotion = false,
  rendererPreference = 'auto',
  scale,
  silhouetteOnly = false,
  bossId,
  bossTier,
  presentationContext = 'overworld',
  battlePose,
  showcasePose,
  onResolution,
  onPresentationResolution,
  visibleLayers,
}: BuddySpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderSequenceRef = useRef(0);
  const [animationFrame, setAnimationFrame] = useState(0);
  const defaultScaleByContext: Record<BuddyPresentationContext, number> = {
    overworld: compact ? 1.35 : 3.2,
    menu: compact ? 1 : 1.5,
    battle: bossId ? 1.5 : 2,
    showcase: 2,
    dialogue: 1,
  };
  const resolvedScale = scale ?? defaultScaleByContext[presentationContext];

  useEffect(() => {
    if (
      !animated ||
      reducedMotion ||
      presentationContext !== 'overworld'
    ) {
      setAnimationFrame(0);
      return;
    }
    const timing = resolveReactBuddySpriteFrame({
      speciesId: creature.id,
      direction,
      pose,
      animationFrame: 0,
      rendererPreference,
    });
    const interval = window.setInterval(
      () => setAnimationFrame((frame) => (frame + 1) % 2),
      timing.durationMs,
    );
    return () => window.clearInterval(interval);
  }, [
    animated,
    creature.id,
    direction,
    pose,
    reducedMotion,
    rendererPreference,
    presentationContext,
  ]);

  const presentationResolution = useMemo(
    () =>
      resolveReactBuddyPresentationFrame({
        speciesId: creature.id,
        bossId,
        context: presentationContext,
        direction,
        pose,
        battlePose,
        showcasePose,
        bossTier,
        animationFrame,
        rendererPreference,
      }),
    [
      animationFrame,
      battlePose,
      bossId,
      bossTier,
      creature.id,
      direction,
      pose,
      presentationContext,
      rendererPreference,
      showcasePose,
    ],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    onPresentationResolution?.(presentationResolution);
    if (presentationResolution.overworldFrame) {
      onResolution?.(presentationResolution.overworldFrame);
    }
    const sequence = renderSequenceRef.current + 1;
    renderSequenceRef.current = sequence;
    const workCanvas = document.createElement('canvas');
    workCanvas.width = presentationResolution.frameWidth;
    workCanvas.height = presentationResolution.frameHeight;
    const workContext = workCanvas.getContext('2d', {
      willReadFrequently: true,
    });
    if (!workContext) return;
    const render =
      presentationContext === 'overworld' &&
      presentationResolution.overworldFrame
        ? renderResolvedBuddySprite({
            context: workContext,
            resolution: presentationResolution.overworldFrame,
            species: creature,
            cosmetics,
            animationCueId,
            bossId,
            bossTier,
            visibleLayers: visibleLayers
              ? new Set(visibleLayers)
              : undefined,
          })
        : renderResolvedBuddyPresentation({
            context: workContext,
            resolution: presentationResolution,
            species: creature,
            cosmetics,
            animationCueId,
            bossId,
            bossTier,
            visibleLayers: visibleLayers
              ? new Set(visibleLayers)
              : undefined,
          });
    void render.then(() => {
      if (renderSequenceRef.current !== sequence) return;
      context.imageSmoothingEnabled = false;
      context.clearRect(
        0,
        0,
        presentationResolution.frameWidth,
        presentationResolution.frameHeight,
      );
      context.drawImage(workCanvas, 0, 0);
    });
    const releaseUrl =
      presentationResolution.loadGroup === 'core'
        ? undefined
        : presentationResolution.assetUrl;
    return () => {
      if (releaseUrl) releaseBuddyPresentationImage(releaseUrl);
    };
  }, [
    animationCueId,
    bossId,
    bossTier,
    cosmetics,
    creature,
    onResolution,
    onPresentationResolution,
    presentationContext,
    presentationResolution,
    visibleLayers,
  ]);

  return (
    <canvas
      aria-label={
        label ??
        `${creature.name} ${presentationContext} pixel sprite: ${
          presentationResolution.selectedPoseId
        }`
      }
      className={`pixel-sprite buddy-pixel-canvas${
        compact ? ' compact' : ''
      }${silhouetteOnly ? ' silhouette-only' : ''}`}
      data-asset-key={presentationResolution.assetKey}
      data-frame-height={presentationResolution.frameHeight}
      data-frame-width={presentationResolution.frameWidth}
      data-presentation-context={presentationContext}
      data-presentation-source={presentationResolution.source}
      height={presentationResolution.frameHeight}
      ref={canvasRef}
      role="img"
      style={
        {
          '--buddy-pixel-height': `${
            presentationResolution.frameHeight * resolvedScale
          }px`,
          '--buddy-pixel-width': `${
            presentationResolution.frameWidth * resolvedScale
          }px`,
        } as CSSProperties
      }
      width={presentationResolution.frameWidth}
    />
  );
}
