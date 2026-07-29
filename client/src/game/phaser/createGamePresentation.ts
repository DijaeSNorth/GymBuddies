import Phaser from 'phaser';

import { OverworldScene } from './OverworldScene';
import {
  GAME_LOGICAL_HEIGHT,
  GAME_LOGICAL_WIDTH,
  PRESENTATION_PALETTE,
  type GamePresentationSnapshot,
} from './presentationConfig';

export interface GamePresentationController {
  destroy: () => void;
  performFeedback: (kind: 'confirm' | 'move') => void;
  setDebugOverlay: (visible: boolean) => void;
  setPaused: (paused: boolean) => void;
  setSnapshot: (snapshot: GamePresentationSnapshot) => void;
}

export function createGamePresentation(
  parent: HTMLElement,
  initialSnapshot: GamePresentationSnapshot,
): GamePresentationController {
  const scene = new OverworldScene(initialSnapshot);
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: GAME_LOGICAL_WIDTH,
    height: GAME_LOGICAL_HEIGHT,
    backgroundColor: PRESENTATION_PALETTE.midnight,
    scene,
    banner: false,
    loader: {
      baseURL: import.meta.env.BASE_URL,
    },
    input: {
      gamepad: false,
      keyboard: false,
      mouse: false,
      touch: false,
    },
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
    },
    scale: {
      mode: Phaser.Scale.NONE,
      width: GAME_LOGICAL_WIDTH,
      height: GAME_LOGICAL_HEIGHT,
    },
  });

  return {
    destroy() {
      game.destroy(true);
    },
    performFeedback(kind) {
      scene.performFeedback(kind);
    },
    setDebugOverlay(visible) {
      scene.setDebugOverlay(visible);
    },
    setPaused(paused) {
      if (paused) {
        game.loop.sleep();
      } else {
        game.loop.wake();
      }
    },
    setSnapshot(snapshot) {
      scene.setSnapshot(snapshot);
    },
  };
}
