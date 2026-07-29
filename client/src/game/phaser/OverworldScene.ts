import Phaser from 'phaser';

import { getOverworldMap } from '../content/maps/journeyMaps';
import {
  getWorldJourneyConnection,
  isWorldConnectionAccessible,
} from '../content/worldGraph';
import type {
  OverworldInteractable,
  OverworldMapConfig,
  OverworldProp,
  OverworldTilePosition,
} from '../types';
import {
  PRESENTATION_PALETTE_NUMBERS,
  type GamePresentationSnapshot,
} from './presentationConfig';
import {
  PRESENTATION_EFFECT_TIMING,
  trainerEmoteLabel,
  type PresentationEffectCue,
} from './presentationEffects';
import {
  renderTrainerPixelFrame,
  TRAINER_PIXEL_HEIGHT,
  TRAINER_PIXEL_WIDTH,
} from '../rendering/trainerPixelRenderer';
import {
  getWorldCharacterDesign,
  trainerAppearanceFromCharacterDesign,
} from '../systems/characterDesign';

function colorFromHex(value: string, fallback: number) {
  const parsed = Number.parseInt(value.replace('#', ''), 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function tileCenter(position: OverworldTilePosition, tileSize: number) {
  return {
    x: position.x * tileSize + tileSize / 2,
    y: position.y * tileSize + tileSize,
  };
}

export class OverworldScene extends Phaser.Scene {
  private snapshot: GamePresentationSnapshot;
  private mapLayer?: Phaser.GameObjects.Graphics;
  private objectLayer?: Phaser.GameObjects.Graphics;
  private ambientLayer?: Phaser.GameObjects.Graphics;
  private effectLayer?: Phaser.GameObjects.Graphics;
  private transitionLayer?: Phaser.GameObjects.Graphics;
  private debugLayer?: Phaser.GameObjects.Graphics;
  private debugLabels?: Phaser.GameObjects.Group;
  private trainer?: Phaser.GameObjects.Container;
  private trainerGraphics?: Phaser.GameObjects.Graphics;
  private trainerEmoteLabel?: Phaser.GameObjects.Text;
  private effectLabel?: Phaser.GameObjects.Text;
  private currentLocationId?: string;
  private lastMovementSequence = -1;
  private lastEffectSequence = 0;
  private ambientFrame = 0;
  private debugVisible = false;
  private ambientTimer?: Phaser.Time.TimerEvent;
  private idleTimer?: Phaser.Time.TimerEvent;

  constructor(initialSnapshot: GamePresentationSnapshot) {
    super({ key: 'gym-buddies-overworld' });
    this.snapshot = initialSnapshot;
  }

  create() {
    this.mapLayer = this.add.graphics();
    this.objectLayer = this.add.graphics().setDepth(3);
    this.ambientLayer = this.add.graphics().setDepth(4);
    this.effectLayer = this.add.graphics().setDepth(18).setScrollFactor(0);
    this.transitionLayer = this.add.graphics().setDepth(19).setScrollFactor(0);
    this.debugLayer = this.add.graphics().setDepth(20);
    this.debugLabels = this.add.group();
    this.trainerGraphics = this.add.graphics();
    this.trainerEmoteLabel = this.add
      .text(0, -22, '', {
        color: '#eef2d0',
        fontFamily: '"Lucida Console", monospace',
        fontSize: '5px',
        backgroundColor: '#061519',
        padding: { x: 2, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setResolution(1);
    this.trainer = this.add
      .container(0, 0, [this.trainerGraphics, this.trainerEmoteLabel])
      .setDepth(10);
    this.effectLabel = this.add
      .text(120, 25, '', {
        color: '#eef2d0',
        fontFamily: '"Lucida Console", monospace',
        fontSize: '6px',
        backgroundColor: '#061519',
        padding: { x: 3, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(19)
      .setScrollFactor(0)
      .setResolution(1)
      .setVisible(false);

    this.cameras.main.setRoundPixels(true);
    this.game.canvas.setAttribute('aria-hidden', 'true');
    this.game.canvas.setAttribute('role', 'presentation');
    this.game.canvas.tabIndex = -1;

    this.lastEffectSequence = this.snapshot.effect?.sequence ?? 0;
    this.ambientTimer = this.time.addEvent({
      delay: PRESENTATION_EFFECT_TIMING.ambientFrameMs,
      loop: true,
      callback: () => {
        if (this.snapshot.motion.reducedMotion) return;
        this.ambientFrame = (this.ambientFrame + 1) % 4;
        this.drawAmbientFrame(getOverworldMap(this.snapshot.locationId));
      },
    });
    this.ambientTimer.paused = this.snapshot.motion.reducedMotion;
    this.rebuildLocation(true);
  }

  setSnapshot(snapshot: GamePresentationSnapshot) {
    const previousLocationId = this.snapshot.locationId;
    const previousMovementSequence = this.snapshot.movementSequence;
    const previousReducedMotion = this.snapshot.motion.reducedMotion;
    const previousTrainerEmote = this.snapshot.trainerEmote;
    const progressionChanged =
      this.snapshot.visitedZoneIds.join('|') !== snapshot.visitedZoneIds.join('|') ||
      this.snapshot.defeatedGymIds.join('|') !== snapshot.defeatedGymIds.join('|');
    this.snapshot = snapshot;
    if (!this.sys.isActive()) return;

    if (snapshot.motion.reducedMotion !== previousReducedMotion) {
      if (this.ambientTimer) {
        this.ambientTimer.paused = snapshot.motion.reducedMotion;
      }
      this.ambientFrame = 0;
      this.drawAmbientFrame(getOverworldMap(snapshot.locationId));
    }
    if (
      snapshot.effect &&
      snapshot.effect.sequence !== this.lastEffectSequence
    ) {
      this.playPresentationEffect(snapshot.effect);
    }
    if (snapshot.trainerEmote !== previousTrainerEmote) {
      this.renderTrainerEmote(true);
    }
    if (snapshot.locationId !== previousLocationId) {
      this.playLocationTransition();
      return;
    }

    if (snapshot.movementSequence !== previousMovementSequence) {
      this.animateTrainerStep();
    } else {
      this.renderTrainer(0);
    }
    if (progressionChanged) {
      this.drawObjects(getOverworldMap(snapshot.locationId));
      this.drawDebugOverlay();
    }
  }

  setDebugOverlay(visible: boolean) {
    this.debugVisible = visible;
    this.drawDebugOverlay();
  }

  performFeedback(kind: 'confirm' | 'move') {
    if (!this.sys.isActive() || this.snapshot.motion.reducedMotion) return;
    if (kind === 'confirm' && this.snapshot.motion.screenShake) {
      this.cameras.main.shake(42, 0.0012);
    }
    if (kind === 'confirm') this.drawInteractionPulse();
  }

  private playLocationTransition() {
    const layer = this.transitionLayer;
    if (!layer || this.snapshot.motion.reducedMotion) {
      this.rebuildLocation(false);
      return;
    }

    this.tweens.killTweensOf(layer);
    layer.clear();
    layer.setAlpha(1).setX(-240);
    layer.fillStyle(PRESENTATION_PALETTE_NUMBERS.midnight, 0.96);
    layer.fillRect(0, 0, 240, 160);
    layer.fillStyle(PRESENTATION_PALETTE_NUMBERS.mint, 0.92);
    layer.fillRect(0, 67, 240, 3);
    layer.fillStyle(PRESENTATION_PALETTE_NUMBERS.amber, 0.88);
    layer.fillRect(0, 74, 240, 1);
    layer.fillStyle(PRESENTATION_PALETTE_NUMBERS.iron, 1);
    for (let x = 0; x < 240; x += 16) {
      layer.fillRect(x, 84, 8, 2);
    }
    this.tweens.add({
      targets: layer,
      x: 0,
      duration: 72,
      ease: 'Linear',
      onComplete: () => {
        this.rebuildLocation(false);
        this.tweens.add({
          targets: layer,
          x: 240,
          duration: 112,
          ease: 'Linear',
          onComplete: () => {
            layer.clear();
            layer.setX(0);
          },
        });
      },
    });
  }

  private playPresentationEffect(cue: PresentationEffectCue) {
    const layer = this.effectLayer;
    const label = this.effectLabel;
    if (!layer || !label) return;
    this.lastEffectSequence = cue.sequence;
    this.tweens.killTweensOf(layer);
    this.tweens.killTweensOf(label);
    layer.clear().setAlpha(1).setPosition(0, 0);
    label
      .setAlpha(1)
      .setText(cue.label.slice(0, 24))
      .setVisible(true)
      .setColor(
        cue.tone === 'failure' || cue.tone === 'resisted'
          ? '#ef6a5b'
          : cue.tone === 'success' || cue.tone === 'advance'
            ? '#68d39b'
            : '#f2c14e',
      );

    const color =
      cue.tone === 'failure' || cue.tone === 'resisted'
        ? PRESENTATION_PALETTE_NUMBERS.coral
        : cue.tone === 'success' || cue.tone === 'advance'
          ? PRESENTATION_PALETTE_NUMBERS.mint
          : PRESENTATION_PALETTE_NUMBERS.amber;
    layer.lineStyle(2, color, 0.92);

    if (cue.kind === 'arm-impact') {
      layer.lineBetween(92, 76, 108, 80);
      layer.lineBetween(132, 80, 148, 76);
      layer.lineBetween(96, 86, 108, 82);
      layer.lineBetween(132, 82, 144, 86);
      layer.fillStyle(PRESENTATION_PALETTE_NUMBERS.chalk, 0.9);
      layer.fillRect(117, 77, 6, 6);
    } else if (cue.kind === 'capture-success') {
      layer.strokeRect(105, 64, 30, 30);
      layer.strokeRect(109, 68, 22, 22);
      layer.strokeRect(114, 73, 12, 12);
    } else if (cue.kind === 'capture-failure') {
      layer.lineBetween(106, 68, 134, 92);
      layer.lineBetween(134, 68, 106, 92);
      layer.strokeRect(102, 64, 36, 32);
    } else if (cue.kind === 'level-up') {
      for (let x = 103; x <= 131; x += 7) {
        layer.lineBetween(x, 90, x + 3, 85);
        layer.lineBetween(x + 3, 85, x + 6, 90);
      }
      layer.strokeRect(108, 65, 24, 14);
    } else if (cue.kind === 'boss-entrance') {
      layer.fillStyle(color, 0.76);
      layer.fillRect(13, 34, 3, 92);
      layer.fillRect(224, 34, 3, 92);
      layer.fillRect(18, 39, 1, 82);
      layer.fillRect(221, 39, 1, 82);
    } else {
      layer.fillStyle(color, 0.86);
      layer.fillRect(107, 76, 26, 3);
      layer.fillRect(113, 71, 14, 13);
      layer.fillStyle(PRESENTATION_PALETTE_NUMBERS.chalk, 0.9);
      layer.fillRect(118, 74, 4, 7);
    }

    if (
      !this.snapshot.motion.reducedMotion &&
      this.snapshot.motion.screenShake
    ) {
      const intensity =
        cue.kind === 'arm-impact'
          ? 0.0018
          : cue.kind === 'boss-entrance'
            ? 0.0012
            : 0.0008;
      this.cameras.main.shake(cue.kind === 'arm-impact' ? 46 : 36, intensity);
    }

    const duration = this.snapshot.motion.reducedMotion
      ? PRESENTATION_EFFECT_TIMING.reducedMotionSequenceMs
      : cue.kind === 'boss-entrance' || cue.kind === 'level-up'
        ? 420
        : 240;
    this.tweens.add({
      targets: [layer, label],
      alpha: 0,
      delay: Math.max(20, Math.round(duration * 0.48)),
      duration: Math.max(40, Math.round(duration * 0.52)),
      ease: 'Linear',
      onComplete: () => {
        layer.clear().setAlpha(1);
        label.setVisible(false).setAlpha(1);
      },
    });
  }

  private drawInteractionPulse() {
    const layer = this.effectLayer;
    if (!layer) return;
    const map = getOverworldMap(this.snapshot.locationId);
    const offset =
      this.snapshot.facing === 'up'
        ? { x: 0, y: -1 }
        : this.snapshot.facing === 'down'
          ? { x: 0, y: 1 }
          : this.snapshot.facing === 'left'
            ? { x: -1, y: 0 }
            : { x: 1, y: 0 };
    const worldX = (this.snapshot.playerTileX + offset.x) * map.tileSize;
    const worldY = (this.snapshot.playerTileY + offset.y) * map.tileSize;
    const camera = this.cameras.main;
    const screenX = worldX - camera.worldView.x;
    const screenY = worldY - camera.worldView.y;

    this.tweens.killTweensOf(layer);
    layer.clear().setAlpha(1).setPosition(0, 0);
    layer.lineStyle(1, PRESENTATION_PALETTE_NUMBERS.amber, 0.9);
    layer.strokeRect(screenX + 0.5, screenY + 0.5, map.tileSize - 1, map.tileSize - 1);
    this.tweens.add({
      targets: layer,
      alpha: 0,
      duration: 120,
      ease: 'Linear',
      onComplete: () => layer.clear().setAlpha(1),
    });
  }

  private rebuildLocation(initial: boolean) {
    const map = getOverworldMap(this.snapshot.locationId);
    this.currentLocationId = map.id;
    this.lastMovementSequence = this.snapshot.movementSequence;
    this.drawMap(map);
    this.drawObjects(map);
    this.drawDebugOverlay();

    const position = tileCenter(
      { x: this.snapshot.playerTileX, y: this.snapshot.playerTileY },
      map.tileSize,
    );
    this.trainer?.setPosition(position.x, position.y);
    this.renderTrainer(0);
    this.renderTrainerEmote(false);

    const width = map.width * map.tileSize;
    const height = map.height * map.tileSize;
    this.cameras.main.setBounds(0, 0, width, height);
    if (this.trainer) {
      this.cameras.main.startFollow(this.trainer, true, 0.14, 0.14);
      this.cameras.main.setDeadzone(48, 32);
    }
    if (initial) this.cameras.main.centerOn(position.x, position.y);
  }

  private drawMap(map: OverworldMapConfig) {
    const graphics = this.mapLayer;
    if (!graphics) return;
    graphics.clear();

    const baseColor = colorFromHex(map.palette.ground, PRESENTATION_PALETTE_NUMBERS.deepTeal);
    const alternateColor = colorFromHex(
      map.palette.groundAlternate,
      PRESENTATION_PALETTE_NUMBERS.iron,
    );
    const wallColor = colorFromHex(map.palette.wall, PRESENTATION_PALETTE_NUMBERS.midnight);
    const accentColor = colorFromHex(map.palette.accent, PRESENTATION_PALETTE_NUMBERS.amber);
    graphics.fillStyle(wallColor);
    graphics.fillRect(0, 0, map.width * map.tileSize, map.height * map.tileSize);

    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        graphics.fillStyle((x + y) % 2 === 0 ? baseColor : alternateColor, (x + y) % 2 === 0 ? 1 : 0.42);
        graphics.fillRect(
          x * map.tileSize,
          y * map.tileSize,
          map.tileSize,
          map.tileSize,
        );
      }
    }

    map.encounterAreas.forEach((area) => {
      const encounterColor = colorFromHex(
        area.rarity === 'rare'
          ? map.palette.rareEncounter
          : map.palette.encounter,
        PRESENTATION_PALETTE_NUMBERS.mint,
      );
      graphics.fillStyle(encounterColor, area.rarity === 'rare' ? 0.28 : 0.18);
      graphics.fillRect(
        area.x * map.tileSize,
        area.y * map.tileSize,
        area.width * map.tileSize,
        area.height * map.tileSize,
      );
      graphics.fillStyle(encounterColor, area.rarity === 'rare' ? 0.72 : 0.55);
      for (let y = area.y; y < area.y + area.height; y += 1) {
        for (let x = area.x; x < area.x + area.width; x += 1) {
          if ((x + y + (area.rarity === 'rare' ? 1 : 0)) % 2 === 0) {
            graphics.fillRect(
              x * map.tileSize + 3,
              y * map.tileSize + 3,
              2,
              2,
            );
          }
        }
      }
    });

    map.lights.forEach((light) => {
      graphics.fillStyle(colorFromHex(light.color, accentColor), light.alpha);
      graphics.fillRect(
        light.x * map.tileSize,
        light.y * map.tileSize,
        light.width * map.tileSize,
        light.height * map.tileSize,
      );
    });

    map.collisionRects.forEach((rect) => {
      graphics.fillStyle(wallColor, 1);
      graphics.fillRect(
        rect.x * map.tileSize,
        rect.y * map.tileSize,
        rect.width * map.tileSize,
        rect.height * map.tileSize,
      );
      graphics.lineStyle(1, accentColor, 0.55);
      graphics.strokeRect(
        rect.x * map.tileSize + 0.5,
        rect.y * map.tileSize + 0.5,
        rect.width * map.tileSize - 1,
        rect.height * map.tileSize - 1,
      );
    });

    if (map.kind === 'route') {
      graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.chalk, 0.12);
      graphics.fillRect(0, 9 * map.tileSize, map.width * map.tileSize, 3 * map.tileSize);
      graphics.lineStyle(1, accentColor, 0.58);
      graphics.lineBetween(0, 10 * map.tileSize, map.width * map.tileSize, 10 * map.tileSize);
    } else {
      graphics.lineStyle(1, PRESENTATION_PALETTE_NUMBERS.mist, 0.16);
      for (let x = 4; x < map.width - 4; x += 4) {
        graphics.lineBetween(
          x * map.tileSize,
          7 * map.tileSize,
          x * map.tileSize,
          21 * map.tileSize,
        );
      }
    }
  }

  private drawObjects(map: OverworldMapConfig) {
    const graphics = this.objectLayer;
    if (!graphics) return;
    graphics.clear();
    map.props.forEach((prop) => this.drawProp(graphics, prop, map));
    map.interactables.forEach((interactable) => {
      const x = interactable.position.x * map.tileSize;
      const y = interactable.position.y * map.tileSize;
      if (interactable.kind === 'door') {
        const transition = map.transitions.find(
          (entry) => entry.id === interactable.transitionId,
        );
        const locked = transition
          ? !isWorldConnectionAccessible(
              getWorldJourneyConnection(transition.connectionId),
              {
                visitedZoneIds: this.snapshot.visitedZoneIds,
                defeatedGymIds: this.snapshot.defeatedGymIds,
              },
            )
          : false;
        this.drawDoor(graphics, x, y, map.tileSize, map, locked);
      }
      if (interactable.kind === 'sign') this.drawSign(graphics, x, y, map.tileSize);
      if (interactable.kind === 'machine') this.drawMachine(graphics, interactable, map.tileSize);
      if (interactable.kind === 'npc') {
        this.drawNpc(graphics, interactable, x, y, map.tileSize);
      }
      if (interactable.kind === 'recovery') {
        this.drawRecovery(graphics, x, y, map.tileSize, map);
      }
    });
    map.transitions
      .filter((transition) => transition.trigger === 'step')
      .forEach((transition) => {
        const x = transition.position.x * map.tileSize;
        const y = transition.position.y * map.tileSize;
        const points =
          transition.position.x === 0
            ? [
                new Phaser.Math.Vector2(x + 1, y + 4),
                new Phaser.Math.Vector2(x + 6, y + 1),
                new Phaser.Math.Vector2(x + 6, y + 7),
              ]
            : [
                new Phaser.Math.Vector2(x + 7, y + 4),
                new Phaser.Math.Vector2(x + 2, y + 1),
                new Phaser.Math.Vector2(x + 2, y + 7),
              ];
        const accessible = isWorldConnectionAccessible(
          getWorldJourneyConnection(transition.connectionId),
          {
            visitedZoneIds: this.snapshot.visitedZoneIds,
            defeatedGymIds: this.snapshot.defeatedGymIds,
          },
        );
        graphics.fillStyle(
          accessible
            ? colorFromHex(map.palette.accent, PRESENTATION_PALETTE_NUMBERS.amber)
            : PRESENTATION_PALETTE_NUMBERS.iron,
        );
        graphics.fillPoints(points, true);
      });
    this.drawAmbientFrame(map);
  }

  private drawAmbientFrame(map: OverworldMapConfig) {
    const graphics = this.ambientLayer;
    if (!graphics || this.currentLocationId !== map.id) return;
    graphics.clear();
    const phase = this.snapshot.motion.reducedMotion ? 0 : this.ambientFrame;
    const accent = colorFromHex(
      map.palette.accent,
      PRESENTATION_PALETTE_NUMBERS.amber,
    );
    const light = colorFromHex(
      map.palette.light,
      PRESENTATION_PALETTE_NUMBERS.mist,
    );

    map.props.forEach((prop) => {
      const x = prop.position.x * map.tileSize;
      const y = prop.position.y * map.tileSize;
      if (prop.kind === 'fan') {
        const spokes = [
          [
            { x: 0, y: -3 },
            { x: 3, y: 0 },
            { x: 0, y: 3 },
            { x: -3, y: 0 },
          ],
          [
            { x: 2, y: -2 },
            { x: 2, y: 2 },
            { x: -2, y: 2 },
            { x: -2, y: -2 },
          ],
        ][phase % 2]!;
        graphics.lineStyle(1, accent, 0.92);
        spokes.forEach((spoke) => {
          graphics.lineBetween(
            x + 4,
            y + 4,
            x + 4 + spoke.x,
            y + 4 + spoke.y,
          );
        });
        graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.chalk, 0.9);
        graphics.fillRect(x + 3, y + 3, 2, 2);
      } else if (prop.kind === 'steam-vent') {
        const lift = phase % 3;
        graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.chalk, 0.24);
        graphics.fillRect(x + 2 + (phase % 2), y + 3 - lift, 2, 2);
        graphics.fillRect(x + 5 - (phase % 2), y + 1 - lift, 1, 2);
      } else if (prop.kind === 'light-post') {
        graphics.fillStyle(light, 0.1 + (phase % 2) * 0.08);
        graphics.fillCircle(x + 4, y + 2, 5 + (phase % 2));
      } else if (prop.kind === 'banner') {
        graphics.fillStyle(accent, 0.62);
        graphics.fillRect(x + 3, y + 2 + (phase % 2), 4, 1);
      }
    });

    map.interactables
      .filter((interactable) => interactable.kind === 'machine')
      .forEach((interactable) => {
        const footprint = interactable.footprint ?? {
          ...interactable.position,
          width: 1,
          height: 1,
        };
        const x = footprint.x * map.tileSize;
        const y = footprint.y * map.tileSize;
        const width = footprint.width * map.tileSize;
        const handleY =
          y + Math.floor((footprint.height * map.tileSize) / 2) - (phase % 2);
        graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.mint, 0.86);
        graphics.fillRect(x + 4, handleY, Math.max(2, width - 8), 1);
        graphics.fillStyle(accent, 0.92);
        graphics.fillRect(x + Math.floor(width / 2) - 2, handleY - 1, 4, 3);
      });
  }

  private drawDoor(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    tileSize: number,
    map: OverworldMapConfig,
    locked: boolean,
  ) {
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.midnight);
    graphics.fillRect(x, y - tileSize, tileSize, tileSize * 2);
    graphics.fillStyle(
      locked
        ? PRESENTATION_PALETTE_NUMBERS.iron
        : colorFromHex(map.palette.accent, PRESENTATION_PALETTE_NUMBERS.coral),
    );
    graphics.fillRect(x + 1, y - tileSize + 1, tileSize - 2, tileSize * 2 - 1);
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.amber);
    graphics.fillRect(x + tileSize - 3, y + 2, 1, 1);
    if (locked) {
      graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.midnight);
      graphics.fillRect(x + 2, y - 1, tileSize - 4, 5);
      graphics.lineStyle(1, PRESENTATION_PALETTE_NUMBERS.chalk, 1);
      graphics.strokeRect(x + 3, y - 4, tileSize - 6, 4);
    }
  }

  private drawRecovery(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    tileSize: number,
    map: OverworldMapConfig,
  ) {
    const accent = colorFromHex(map.palette.encounter, PRESENTATION_PALETTE_NUMBERS.mint);
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.midnight);
    graphics.fillRect(x, y + 2, tileSize, tileSize - 2);
    graphics.fillStyle(accent);
    graphics.fillRect(x + 1, y + 1, tileSize - 2, 3);
    graphics.fillRect(x + 3, y - 2, 2, 8);
    graphics.fillRect(x, y + 1, tileSize, 2);
  }

  private drawProp(
    graphics: Phaser.GameObjects.Graphics,
    prop: OverworldProp,
    map: OverworldMapConfig,
  ) {
    const tileSize = map.tileSize;
    const x = prop.position.x * tileSize;
    const y = prop.position.y * tileSize;
    const accent = colorFromHex(map.palette.accent, PRESENTATION_PALETTE_NUMBERS.amber);
    const ground = colorFromHex(map.palette.wall, PRESENTATION_PALETTE_NUMBERS.midnight);
    graphics.fillStyle(ground, 0.75);

    if (prop.kind === 'banner') {
      graphics.fillRect(x + 1, y, 1, tileSize);
      graphics.fillStyle(accent);
      graphics.fillTriangle(x + 2, y, x + 7, y + 2, x + 2, y + 5);
    } else if (prop.kind === 'bench') {
      graphics.fillRect(x, y + 4, tileSize, 2);
      graphics.fillRect(x + 1, y + 6, 1, 2);
      graphics.fillRect(x + 6, y + 6, 1, 2);
    } else if (prop.kind === 'chain-post') {
      graphics.fillRect(x + 1, y + 2, 2, 6);
      graphics.fillRect(x + 6, y + 2, 2, 6);
      graphics.lineStyle(1, accent, 0.9);
      graphics.lineBetween(x + 3, y + 3, x + 6, y + 6);
    } else if (prop.kind === 'chalk-mark') {
      graphics.lineStyle(1, PRESENTATION_PALETTE_NUMBERS.chalk, 0.55);
      graphics.strokeCircle(x + 4, y + 4, 3);
      graphics.lineBetween(x + 1, y + 4, x + 7, y + 4);
    } else if (prop.kind === 'fan') {
      graphics.fillCircle(x + 4, y + 4, 4);
      graphics.fillStyle(accent);
      graphics.fillTriangle(x + 4, y + 4, x + 2, y, x + 5, y + 2);
      graphics.fillTriangle(x + 4, y + 4, x + 8, y + 3, x + 6, y + 6);
      graphics.fillTriangle(x + 4, y + 4, x + 3, y + 8, x + 1, y + 5);
    } else if (prop.kind === 'hydration') {
      graphics.fillRect(x + 2, y + 1, 4, 7);
      graphics.fillStyle(accent);
      graphics.fillRect(x + 3, y + 2, 2, 2);
    } else if (prop.kind === 'light-post') {
      graphics.fillRect(x + 3, y + 2, 2, 6);
      graphics.fillStyle(accent, 0.9);
      graphics.fillCircle(x + 4, y + 2, 3);
    } else if (prop.kind === 'plate-stack') {
      graphics.fillRect(x + 1, y + 2, 6, 2);
      graphics.fillRect(x, y + 5, 8, 2);
      graphics.fillStyle(accent);
      graphics.fillRect(x + 3, y, 2, 8);
    } else if (prop.kind === 'planter') {
      graphics.fillRect(x + 1, y + 5, 6, 3);
      graphics.fillStyle(colorFromHex(map.palette.encounter, PRESENTATION_PALETTE_NUMBERS.mint));
      graphics.fillCircle(x + 3, y + 3, 2);
      graphics.fillCircle(x + 5, y + 2, 2);
    } else if (prop.kind === 'steam-vent') {
      graphics.fillRect(x, y + 6, 8, 2);
      graphics.lineStyle(1, PRESENTATION_PALETTE_NUMBERS.chalk, 0.45);
      graphics.lineBetween(x + 2, y + 6, x + 3, y + 1);
      graphics.lineBetween(x + 5, y + 6, x + 6, y + 2);
    } else if (prop.kind === 'trophy') {
      graphics.fillStyle(accent);
      graphics.fillRect(x + 2, y + 1, 4, 4);
      graphics.fillRect(x + 3, y + 5, 2, 2);
      graphics.fillRect(x + 1, y + 7, 6, 1);
    }
  }

  private drawSign(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    tileSize: number,
  ) {
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.amber);
    graphics.fillRect(x + 1, y, tileSize - 2, tileSize - 3);
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.midnight);
    graphics.fillRect(x + 2, y + 2, tileSize - 4, 1);
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.iron);
    graphics.fillRect(x + 3, y + tileSize - 3, 2, 3);
  }

  private drawMachine(
    graphics: Phaser.GameObjects.Graphics,
    interactable: OverworldInteractable,
    tileSize: number,
  ) {
    const footprint = interactable.footprint ?? {
      ...interactable.position,
      width: 1,
      height: 1,
    };
    const x = footprint.x * tileSize;
    const y = footprint.y * tileSize;
    const width = footprint.width * tileSize;
    const height = footprint.height * tileSize;
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.midnight);
    graphics.fillRect(x, y, width, height);
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.iron);
    graphics.fillRect(x + 2, y + 1, 2, height - 2);
    graphics.fillRect(x + width - 4, y + 1, 2, height - 2);
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.mint);
    graphics.fillRect(x + 4, y + Math.floor(height / 2), width - 8, 2);
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.coral);
    graphics.fillRect(x + Math.floor(width / 2) - 1, y + 3, 3, 3);
  }

  private drawNpc(
    graphics: Phaser.GameObjects.Graphics,
    interactable: OverworldInteractable,
    x: number,
    y: number,
    tileSize: number,
  ) {
    const character = interactable.characterId
      ? getWorldCharacterDesign(interactable.characterId)
      : null;
    if (character) {
      const appearance = trainerAppearanceFromCharacterDesign(character);
      const frame = renderTrainerPixelFrame(
        appearance,
        'front',
        character.idlePose,
        0,
      );
      const worldPixelScale = 0.34;
      const originX =
        x + tileSize / 2 - (TRAINER_PIXEL_WIDTH * worldPixelScale) / 2;
      const originY = y + tileSize - TRAINER_PIXEL_HEIGHT * worldPixelScale;
      for (const rect of frame.rects) {
        graphics.fillStyle(colorFromHex(rect.color, 0xeef2d0), 1);
        graphics.fillRect(
          originX + rect.x * worldPixelScale,
          originY + rect.y * worldPixelScale,
          Math.max(1, rect.width * worldPixelScale),
          Math.max(1, rect.height * worldPixelScale),
        );
      }
      return;
    }
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.midnight, 0.7);
    graphics.fillEllipse(x + tileSize / 2, y + tileSize, tileSize, 3);
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.amber);
    graphics.fillRect(x + 2, y + 2, tileSize - 4, 4);
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.coral);
    graphics.fillRect(x + 1, y + 6, tileSize - 2, 5);
    graphics.fillStyle(PRESENTATION_PALETTE_NUMBERS.chalk);
    graphics.fillRect(x + 3, y + 3, 1, 1);
    graphics.fillRect(x + tileSize - 4, y + 3, 1, 1);
  }

  private animateTrainerStep() {
    const map = getOverworldMap(this.snapshot.locationId);
    const target = tileCenter(
      { x: this.snapshot.playerTileX, y: this.snapshot.playerTileY },
      map.tileSize,
    );
    this.lastMovementSequence = this.snapshot.movementSequence;
    this.idleTimer?.remove(false);
    if (this.snapshot.motion.reducedMotion || !this.trainer) {
      this.trainer?.setPosition(target.x, target.y);
      this.renderTrainer(0);
      return;
    }
    this.tweens.killTweensOf(this.trainer);
    this.renderTrainer(this.snapshot.movementSequence % 2 === 0 ? 1 : 2);
    this.tweens.add({
      targets: this.trainer,
      x: target.x,
      y: target.y,
      duration: 92,
      ease: 'Linear',
    });
    const sequence = this.snapshot.movementSequence;
    this.idleTimer = this.time.delayedCall(96, () => {
      if (this.snapshot.movementSequence === sequence) this.renderTrainer(0);
    });
  }

  private renderTrainer(walkFrame: number) {
    const graphics = this.trainerGraphics;
    if (!graphics) return;
    graphics.clear();
    const direction =
      this.snapshot.facing === 'up'
        ? 'back'
        : this.snapshot.facing === 'down'
          ? 'front'
          : this.snapshot.facing;
    const frame = renderTrainerPixelFrame(
      this.snapshot.trainerAppearance,
      direction,
      walkFrame === 0 ? 'idle' : 'walking',
      walkFrame,
    );
    const worldPixelScale = 0.5;
    for (const rect of frame.rects) {
      graphics.fillStyle(
        colorFromHex(rect.color, PRESENTATION_PALETTE_NUMBERS.chalk),
      );
      graphics.fillRect(
        (rect.x - TRAINER_PIXEL_WIDTH / 2) * worldPixelScale,
        (rect.y - TRAINER_PIXEL_HEIGHT + 2) * worldPixelScale,
        rect.width * worldPixelScale,
        rect.height * worldPixelScale,
      );
    }
  }

  private renderTrainerEmote(animate: boolean) {
    const label = this.trainerEmoteLabel;
    if (!label) return;
    const text = trainerEmoteLabel(this.snapshot.trainerEmote);
    this.tweens.killTweensOf(label);
    label.setText(text).setVisible(Boolean(text)).setAlpha(1).setY(-22);
    if (
      !text ||
      !animate ||
      this.snapshot.motion.reducedMotion
    ) {
      return;
    }
    label.setAlpha(0).setY(-19);
    this.tweens.add({
      targets: label,
      alpha: 1,
      y: -22,
      duration: 120,
      ease: 'Linear',
    });
  }

  private drawDebugOverlay() {
    const graphics = this.debugLayer;
    if (!graphics || !this.debugLabels) return;
    graphics.clear();
    this.debugLabels.clear(true, true);
    graphics.setVisible(this.debugVisible);
    this.debugLabels.setVisible(this.debugVisible);
    if (!this.debugVisible) return;

    const map = getOverworldMap(this.snapshot.locationId);
    graphics.lineStyle(1, 0x67e8f9, 0.18);
    for (let x = 0; x <= map.width; x += 1) {
      graphics.lineBetween(x * map.tileSize, 0, x * map.tileSize, map.height * map.tileSize);
    }
    for (let y = 0; y <= map.height; y += 1) {
      graphics.lineBetween(0, y * map.tileSize, map.width * map.tileSize, y * map.tileSize);
    }

    graphics.fillStyle(0xef4444, 0.34);
    map.collisionRects.forEach((rect) => {
      graphics.fillRect(
        rect.x * map.tileSize,
        rect.y * map.tileSize,
        rect.width * map.tileSize,
        rect.height * map.tileSize,
      );
    });
    map.interactables.forEach((interactable) => {
      const footprint = interactable.footprint ?? {
        ...interactable.position,
        width: 1,
        height: 1,
      };
      graphics.fillStyle(0xf2c14e, 0.42);
      graphics.fillRect(
        footprint.x * map.tileSize,
        footprint.y * map.tileSize,
        footprint.width * map.tileSize,
        footprint.height * map.tileSize,
      );
      const label = this.add
        .text(
          footprint.x * map.tileSize,
          footprint.y * map.tileSize - 6,
          interactable.id,
          {
            color: '#f2c14e',
            fontFamily: '"Lucida Console", monospace',
            fontSize: '5px',
            backgroundColor: '#061519',
          },
        )
        .setDepth(21)
        .setResolution(1);
      this.debugLabels?.add(label);
    });
    graphics.fillStyle(0xd946ef, 0.22);
    map.encounterAreas.forEach((area) => {
      graphics.fillRect(
        area.x * map.tileSize,
        area.y * map.tileSize,
        area.width * map.tileSize,
        area.height * map.tileSize,
      );
    });
    graphics.fillStyle(0x22d3ee, 0.5);
    map.transitions.forEach((transition) => {
      graphics.fillRect(
        transition.position.x * map.tileSize,
        transition.position.y * map.tileSize,
        map.tileSize,
        map.tileSize,
      );
    });

    const playerPosition = {
      x: this.snapshot.playerTileX,
      y: this.snapshot.playerTileY,
    };
    const facingOffset =
      this.snapshot.facing === 'up'
        ? { x: 0, y: -1 }
        : this.snapshot.facing === 'down'
          ? { x: 0, y: 1 }
          : this.snapshot.facing === 'left'
            ? { x: -1, y: 0 }
            : { x: 1, y: 0 };
    const target = {
      x: playerPosition.x + facingOffset.x,
      y: playerPosition.y + facingOffset.y,
    };
    graphics.lineStyle(1, PRESENTATION_PALETTE_NUMBERS.chalk, 1);
    graphics.strokeRect(
      target.x * map.tileSize + 0.5,
      target.y * map.tileSize + 0.5,
      map.tileSize - 1,
      map.tileSize - 1,
    );
  }
}
