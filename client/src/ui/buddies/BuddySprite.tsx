import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  BUDDY_PIXEL_HEIGHT,
  BUDDY_PIXEL_WIDTH,
  drawBuddyFrameToCanvas,
  renderBuddyPixelFrame,
} from '../../game/rendering/buddyPixelRenderer';
import type {
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
  scale?: number;
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
  scale,
}: BuddySpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const resolvedScale = scale ?? (compact ? 1.35 : 3.2);

  useEffect(() => {
    if (!animated || reducedMotion) {
      setAnimationFrame(0);
      return;
    }
    const interval = window.setInterval(
      () => setAnimationFrame((frame) => (frame + 1) % 2),
      pose === 'running' ? 140 : pose === 'entrance' ? 180 : 280,
    );
    return () => window.clearInterval(interval);
  }, [animated, pose, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    drawBuddyFrameToCanvas(
      context,
      renderBuddyPixelFrame(
        creature,
        cosmetics,
        direction,
        pose,
        animationFrame,
        animationCueId,
      ),
    );
  }, [
    animationFrame,
    animationCueId,
    cosmetics,
    creature,
    direction,
    pose,
  ]);

  return (
    <canvas
      aria-label={
        label ??
        `${creature.name} modular pixel sprite: ${direction}, ${pose}`
      }
      className={`pixel-sprite buddy-pixel-canvas${
        compact ? ' compact' : ''
      }`}
      height={BUDDY_PIXEL_HEIGHT}
      ref={canvasRef}
      role="img"
      style={
        {
          '--buddy-pixel-height': `${BUDDY_PIXEL_HEIGHT * resolvedScale}px`,
          '--buddy-pixel-width': `${BUDDY_PIXEL_WIDTH * resolvedScale}px`,
        } as CSSProperties
      }
      width={BUDDY_PIXEL_WIDTH}
    />
  );
}
