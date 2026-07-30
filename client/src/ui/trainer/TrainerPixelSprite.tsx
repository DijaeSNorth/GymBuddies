import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  drawTrainerFrameToCanvas,
  renderTrainerPixelFrame,
  TRAINER_PIXEL_HEIGHT,
  TRAINER_PIXEL_WIDTH,
} from '../../game/rendering/trainerPixelRenderer';
import type {
  TrainerAppearance,
  TrainerFacingDirection,
  TrainerMuscleHighlightRegion,
  TrainerPose,
} from '../../game/types';

interface TrainerPixelSpriteProps {
  animated?: boolean;
  appearance: TrainerAppearance;
  className?: string;
  direction?: TrainerFacingDirection;
  label?: string;
  highlightRegion?: TrainerMuscleHighlightRegion;
  pose?: TrainerPose;
  reducedMotion?: boolean;
  scale?: number;
  silhouette?: boolean;
}

export function TrainerPixelSprite({
  animated = true,
  appearance,
  className = '',
  direction = 'front',
  highlightRegion,
  label = 'Trainer preview',
  pose = 'idle',
  reducedMotion = false,
  scale = 5,
  silhouette = false,
}: TrainerPixelSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    if (!animated || reducedMotion) {
      setAnimationFrame(0);
      return;
    }
    const interval = window.setInterval(() => {
      setAnimationFrame((frame) => (frame + 1) % 2);
    }, pose === 'running' ? 150 : 280);
    return () => window.clearInterval(interval);
  }, [animated, pose, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const frame = renderTrainerPixelFrame(
      appearance,
      direction,
      pose,
      animationFrame,
    );
    drawTrainerFrameToCanvas(context, frame);
    if (highlightRegion) {
      const bounds = {
        'upper-body': { x: 2, y: 7, width: 24, height: 15 },
        core: { x: 6, y: 17, width: 16, height: 10 },
        'lower-body': { x: 4, y: 23, width: 20, height: 12 },
      }[highlightRegion];
      context.fillStyle = '#f2c14e';
      context.fillRect(bounds.x, bounds.y, 4, 1);
      context.fillRect(bounds.x, bounds.y, 1, 4);
      context.fillRect(bounds.x + bounds.width - 4, bounds.y, 4, 1);
      context.fillRect(bounds.x + bounds.width - 1, bounds.y, 1, 4);
      context.fillRect(bounds.x, bounds.y + bounds.height - 1, 4, 1);
      context.fillRect(bounds.x, bounds.y + bounds.height - 4, 1, 4);
      context.fillRect(
        bounds.x + bounds.width - 4,
        bounds.y + bounds.height - 1,
        4,
        1,
      );
      context.fillRect(
        bounds.x + bounds.width - 1,
        bounds.y + bounds.height - 4,
        1,
        4,
      );
    }
  }, [animationFrame, appearance, direction, highlightRegion, pose]);

  return (
    <canvas
      aria-label={`${label}: ${direction}, ${pose}`}
      className={`trainer-pixel-canvas ${silhouette ? 'trainer-silhouette-canvas' : ''} ${className}`.trim()}
      height={TRAINER_PIXEL_HEIGHT}
      ref={canvasRef}
      role="img"
      style={
        {
          '--trainer-pixel-height': `${TRAINER_PIXEL_HEIGHT * scale}px`,
          '--trainer-pixel-width': `${TRAINER_PIXEL_WIDTH * scale}px`,
        } as CSSProperties
      }
      width={TRAINER_PIXEL_WIDTH}
    />
  );
}
