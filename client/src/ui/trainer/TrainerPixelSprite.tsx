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
  TrainerPose,
} from '../../game/types';

interface TrainerPixelSpriteProps {
  animated?: boolean;
  appearance: TrainerAppearance;
  className?: string;
  direction?: TrainerFacingDirection;
  label?: string;
  pose?: TrainerPose;
  reducedMotion?: boolean;
  scale?: number;
}

export function TrainerPixelSprite({
  animated = true,
  appearance,
  className = '',
  direction = 'front',
  label = 'Trainer preview',
  pose = 'idle',
  reducedMotion = false,
  scale = 5,
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
  }, [animationFrame, appearance, direction, pose]);

  return (
    <canvas
      aria-label={`${label}: ${direction}, ${pose}`}
      className={`trainer-pixel-canvas ${className}`.trim()}
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
