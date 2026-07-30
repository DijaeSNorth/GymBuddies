import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const projectRoot = resolve(import.meta.dirname, '..');
const runtimeRoot = resolve(
  projectRoot,
  'public/assets/gym-buddies/buddies/handcrafted',
);

const COLOR = {
  outline: '#061519',
  shadow: '#0c2b2f',
  primary: '#68d39b',
  secondary: '#285057',
  detail: '#eef2d0',
  accent: '#f2c14e',
  overload: '#ef6a5b',
};

const CHARACTERS = [
  'titan-tortoise',
  'ripped-rhino',
  'boulder-bison',
];
const DIRECTIONS = ['front', 'back', 'left', 'right'];
const OVERWORLD_POSES = [
  'idle',
  'walking',
  'running',
  'training',
  'fatigue',
  'capture',
  'victory',
  'front-flex',
  'back-flex',
  'side-pose',
  'boss-entrance',
  'rare-entrance',
];
const BATTLE_POSES = [
  'neutral-battle',
  'attack-preparation',
  'shoulder-burst',
  'iron-grind',
  'snapping-hook',
  'counter',
  'stamina-loss',
  'near-pin',
  'victory',
  'capture-success',
  'escape',
  'defeat',
];
const SHOWCASE_POSES = [
  'front-relaxed',
  'back-relaxed',
  'front-double-biceps',
  'back-double-biceps',
  'side-chest',
  'side-triceps',
  'most-muscular',
  'abs-and-thigh',
  'victory-pose',
  'fatigue-pose',
];
const BOSS_TIERS = [
  'normal',
  'pumped',
  'overload',
  'final-round',
  'defeated',
];

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1
      ? 0xedb88320 ^ (value >>> 1)
      : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([size, typeBuffer, data, checksum]);
}

function rgba(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
    255,
  ];
}

function encodePng(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0;
    pixels.copy(
      raw,
      rowOffset + 1,
      y * width * 4,
      (y + 1) * width * 4,
    );
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND'),
  ]);
}

function createSurface(width, height) {
  const pixels = Buffer.alloc(width * height * 4);
  const pixel = (x, y, color) => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= width || py >= height) return;
    pixels.set(rgba(color), (py * width + px) * 4);
  };
  return { width, height, pixels, pixel };
}

function createSheet(frameSize, columns, rows) {
  const surface = createSurface(
    frameSize * columns,
    frameSize * rows,
  );
  return {
    ...surface,
    frame(column, row) {
      const originX = column * frameSize;
      const originY = row * frameSize;
      const pixel = (x, y, color) => {
        const px = Math.round(x);
        const py = Math.round(y);
        if (
          px < 1 ||
          py < 1 ||
          px >= frameSize - 1 ||
          py >= frameSize - 1
        ) {
          return;
        }
        surface.pixel(originX + px, originY + py, color);
      };
      const rect = (x, y, width, height, color) => {
        for (
          let py = Math.round(y);
          py < Math.round(y + height);
          py += 1
        ) {
          for (
            let px = Math.round(x);
            px < Math.round(x + width);
            px += 1
          ) {
            pixel(px, py, color);
          }
        }
      };
      const ellipse = (cx, cy, rx, ry, color) => {
        for (
          let py = Math.floor(cy - ry);
          py <= Math.ceil(cy + ry);
          py += 1
        ) {
          for (
            let px = Math.floor(cx - rx);
            px <= Math.ceil(cx + rx);
            px += 1
          ) {
            const dx = (px - cx) / Math.max(1, rx);
            const dy = (py - cy) / Math.max(1, ry);
            if (dx * dx + dy * dy <= 1) pixel(px, py, color);
          }
        }
      };
      const line = (x0, y0, x1, y1, color, thickness = 1) => {
        let x = Math.round(x0);
        let y = Math.round(y0);
        const targetX = Math.round(x1);
        const targetY = Math.round(y1);
        const dx = Math.abs(targetX - x);
        const sx = x < targetX ? 1 : -1;
        const dy = -Math.abs(targetY - y);
        const sy = y < targetY ? 1 : -1;
        let error = dx + dy;
        while (true) {
          rect(
            x - Math.floor(thickness / 2),
            y - Math.floor(thickness / 2),
            thickness,
            thickness,
            color,
          );
          if (x === targetX && y === targetY) break;
          const doubled = 2 * error;
          if (doubled >= dy) {
            error += dy;
            x += sx;
          }
          if (doubled <= dx) {
            error += dx;
            y += sy;
          }
        }
      };
      return { size: frameSize, pixel, rect, ellipse, line };
    },
  };
}

function writePng(path, surface) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    encodePng(surface.width, surface.height, surface.pixels),
  );
  process.stdout.write(`${path}\n`);
}

function outlinedRect(frame, x, y, width, height, color) {
  const border = Math.max(1, Math.round(frame.size / 32));
  frame.rect(x, y, width, height, COLOR.outline);
  frame.rect(
    x + border,
    y + border,
    Math.max(1, width - border * 2),
    Math.max(1, height - border * 2),
    color,
  );
}

function outlinedEllipse(frame, cx, cy, rx, ry, color) {
  const inset = Math.max(1, frame.size / 32);
  frame.ellipse(cx, cy, rx, ry, COLOR.outline);
  frame.ellipse(
    cx,
    cy + inset * 0.15,
    Math.max(1, rx - inset),
    Math.max(1, ry - inset),
    color,
  );
}

function poseState(pose, animationFrame = 0) {
  return {
    lift:
      pose.includes('victory') ||
      pose.includes('double-biceps') ||
      pose.includes('entrance'),
    drive:
      pose === 'training' ||
      pose === 'shoulder-burst' ||
      pose === 'attack-preparation' ||
      pose === 'most-muscular',
    hook:
      pose === 'snapping-hook' ||
      pose === 'counter' ||
      pose.includes('side-'),
    tired:
      pose === 'fatigue' ||
      pose === 'stamina-loss' ||
      pose === 'near-pin' ||
      pose === 'defeat' ||
      pose === 'fatigue-pose',
    back: pose.startsWith('back-'),
    step: animationFrame % 2,
  };
}

function drawShadow(frame, tier = 'normal') {
  const u = frame.size / 24;
  const extra =
    tier === 'overload' || tier === 'final-round' ? 2 * u : 0;
  frame.rect(
    5 * u - extra / 2,
    21 * u,
    14 * u + extra,
    Math.max(1, u),
    COLOR.shadow,
  );
}

function drawPlastrong(
  frame,
  direction,
  pose,
  tier = 'normal',
  boss = false,
  animationFrame = 0,
) {
  const u = frame.size / 24;
  const state = poseState(pose, animationFrame);
  const side = direction === 'left' || direction === 'right';
  const facing = direction === 'left' ? -1 : 1;
  const low = state.tired || tier === 'defeated' ? 1.2 * u : 0;
  const open =
    tier === 'overload' || tier === 'final-round' ? 1.2 * u : 0;
  const step = state.step ? u : 0;
  drawShadow(frame, tier);

  if (side) {
    outlinedEllipse(
      frame,
      12 * u,
      11 * u + low,
      8.5 * u,
      6 * u,
      COLOR.secondary,
    );
    frame.ellipse(
      12 * u,
      9 * u + low,
      6.5 * u,
      3.7 * u,
      COLOR.primary,
    );
    const headX = 12 * u + facing * 8 * u;
    outlinedRect(
      frame,
      headX - 2.2 * u,
      8 * u + low,
      4.4 * u,
      4 * u,
      COLOR.primary,
    );
    frame.pixel(
      headX + facing * u,
      9 * u + low,
      COLOR.detail,
    );
    frame.rect(6 * u, 12 * u + low, 12 * u, 2 * u, COLOR.accent);
    outlinedRect(
      frame,
      4 * u - open,
      14 * u + low + step,
      4 * u,
      6 * u - low,
      COLOR.primary,
    );
    outlinedRect(
      frame,
      16 * u + open,
      14 * u + low - step,
      4 * u,
      6 * u - low,
      COLOR.primary,
    );
    frame.rect(5 * u, 12 * u + low, 2 * u, u, COLOR.detail);
    frame.rect(17 * u, 13 * u + low, 2 * u, u, COLOR.detail);
  } else {
    const center = 12 * u;
    outlinedEllipse(
      frame,
      center,
      11 * u + low,
      9 * u + open,
      7 * u,
      COLOR.secondary,
    );
    frame.ellipse(
      center,
      8.5 * u + low,
      6.5 * u,
      4 * u,
      COLOR.primary,
    );
    outlinedRect(
      frame,
      9 * u,
      3.5 * u + low,
      6 * u,
      5 * u,
      COLOR.primary,
    );
    if (direction !== 'back' && !state.back) {
      frame.pixel(10.5 * u, 5.5 * u + low, COLOR.detail);
      frame.pixel(13.5 * u, 5.5 * u + low, COLOR.detail);
      outlinedRect(
        frame,
        8 * u,
        10 * u + low,
        8 * u,
        6 * u,
        COLOR.accent,
      );
      frame.rect(11.5 * u, 11 * u + low, u, 4 * u, COLOR.outline);
    } else {
      frame.line(7 * u, 9 * u + low, 17 * u, 9 * u + low, COLOR.accent);
      frame.line(12 * u, 7 * u + low, 12 * u, 14 * u + low, COLOR.accent);
    }
    const armY = state.lift ? 7 * u : state.drive ? 10 * u : 12 * u;
    outlinedRect(
      frame,
      2.5 * u - open,
      armY + low,
      4 * u,
      state.lift ? 7 * u : 6 * u,
      COLOR.primary,
    );
    outlinedRect(
      frame,
      17.5 * u + open,
      armY + low,
      4 * u,
      state.lift ? 7 * u : 6 * u,
      COLOR.primary,
    );
    outlinedRect(
      frame,
      6 * u - open,
      16 * u + low + step,
      4 * u,
      5 * u - low,
      COLOR.primary,
    );
    outlinedRect(
      frame,
      14 * u + open,
      16 * u + low - step,
      4 * u,
      5 * u - low,
      COLOR.primary,
    );
    frame.rect(4 * u, 12 * u + low, 2 * u, u, COLOR.detail);
    frame.rect(18 * u, 12 * u + low, 2 * u, u, COLOR.detail);
  }

  const seam =
    tier === 'overload' || tier === 'final-round'
      ? COLOR.overload
      : COLOR.accent;
  frame.line(8 * u, 8 * u + low, 11 * u, 10 * u + low, seam);
  frame.line(16 * u, 8 * u + low, 13 * u, 10 * u + low, seam);
  if (tier === 'pumped' || tier === 'overload' || tier === 'final-round') {
    frame.rect(4 * u, 15 * u + low, 2 * u, u, COLOR.detail);
    frame.rect(18 * u, 15 * u + low, 2 * u, u, COLOR.detail);
  }
  if (boss) {
    frame.line(6 * u, 7 * u + low, 18 * u, 14 * u + low, COLOR.accent);
    frame.line(18 * u, 7 * u + low, 6 * u, 14 * u + low, COLOR.accent);
    frame.rect(10 * u, 9 * u + low, 4 * u, 3 * u, COLOR.detail);
    if (tier === 'final-round') {
      frame.rect(3 * u, 6 * u, 2 * u, 8 * u, COLOR.overload);
      frame.rect(19 * u, 6 * u, 2 * u, 8 * u, COLOR.overload);
    }
  }
}

function drawRailhorn(frame, direction, pose, animationFrame = 0) {
  const u = frame.size / 24;
  const state = poseState(pose, animationFrame);
  const side = direction === 'left' || direction === 'right';
  const facing = direction === 'left' ? -1 : 1;
  const low = state.tired ? u : 0;
  drawShadow(frame);
  if (side) {
    outlinedEllipse(frame, 12 * u, 11 * u + low, 8 * u, 5 * u, COLOR.secondary);
    const headX = 12 * u + facing * 6 * u;
    outlinedRect(frame, headX - 2.5 * u, 7 * u + low, 5 * u, 5 * u, COLOR.primary);
    frame.line(
      headX + facing * 2 * u,
      8 * u + low,
      headX + facing * 7 * u,
      7 * u + low,
      COLOR.detail,
      Math.max(1, u),
    );
    outlinedRect(frame, 4 * u, 13 * u + low, 4 * u, 7 * u - low, COLOR.primary);
    outlinedRect(frame, 16 * u, 14 * u + low, 4 * u, 6 * u - low, COLOR.primary);
  } else {
    outlinedEllipse(frame, 12 * u, 11 * u + low, 8.5 * u, 5.5 * u, COLOR.secondary);
    outlinedRect(frame, 9 * u, 4 * u + low, 6 * u, 6 * u, COLOR.primary);
    if (direction === 'front') {
      frame.line(12 * u, 4 * u + low, 12 * u, 1.5 * u + low, COLOR.detail, Math.max(1, u));
    } else {
      frame.rect(9 * u, 6 * u + low, 6 * u, u, COLOR.accent);
    }
    const armY = state.lift ? 6 * u : 11 * u;
    outlinedRect(frame, 3 * u, armY + low, 4 * u, 8 * u - low, COLOR.primary);
    outlinedRect(frame, 17 * u, armY + low, 4 * u, 8 * u - low, COLOR.primary);
  }
  frame.line(7 * u, 10 * u + low, 11 * u, 11 * u + low, COLOR.accent);
  frame.line(17 * u, 10 * u + low, 13 * u, 11 * u + low, COLOR.accent);
}

function drawCairnox(frame, direction, pose, animationFrame = 0) {
  const u = frame.size / 24;
  const state = poseState(pose, animationFrame);
  const side = direction === 'left' || direction === 'right';
  const low = state.tired ? u : 0;
  const step = state.step ? u : 0;
  drawShadow(frame);
  outlinedEllipse(frame, 12 * u, 10 * u + low, side ? 8 * u : 9 * u, 6 * u, COLOR.secondary);
  outlinedRect(frame, 7 * u, 5 * u + low, 10 * u, 4 * u, COLOR.primary);
  outlinedRect(frame, 9 * u, 3 * u + low, 6 * u, 4 * u, COLOR.secondary);
  frame.line(8 * u, 5 * u + low, 4 * u, 3 * u + low, COLOR.detail, Math.max(1, u));
  frame.line(16 * u, 5 * u + low, 20 * u, 3 * u + low, COLOR.detail, Math.max(1, u));
  frame.line(7 * u, 9 * u + low, 17 * u, 9 * u + low, COLOR.accent);
  outlinedRect(frame, 4 * u, 14 * u + low + step, 4 * u, 7 * u - low, COLOR.primary);
  outlinedRect(frame, 8.5 * u, 15 * u + low - step, 3.5 * u, 6 * u - low, COLOR.primary);
  outlinedRect(frame, 13 * u, 15 * u + low + step, 3.5 * u, 6 * u - low, COLOR.primary);
  outlinedRect(frame, 17 * u, 14 * u + low - step, 4 * u, 7 * u - low, COLOR.primary);
  if (state.lift) {
    frame.rect(4 * u, 10 * u, 3 * u, 5 * u, COLOR.detail);
    frame.rect(17 * u, 10 * u, 3 * u, 5 * u, COLOR.detail);
  }
}

function drawCharacter(
  frame,
  characterId,
  direction,
  pose,
  tier = 'normal',
  boss = false,
  animationFrame = 0,
) {
  if (characterId === 'titan-tortoise' || characterId === 'dome-warden') {
    drawPlastrong(
      frame,
      direction,
      pose,
      tier,
      boss || characterId === 'dome-warden',
      animationFrame,
    );
  } else if (characterId === 'ripped-rhino') {
    drawRailhorn(frame, direction, pose, animationFrame);
  } else {
    drawCairnox(frame, direction, pose, animationFrame);
  }
}

function generateOverworld(characterId) {
  for (const direction of DIRECTIONS) {
    const sheet = createSheet(24, 24, 1);
    OVERWORLD_POSES.forEach((pose, poseIndex) => {
      for (let frameIndex = 0; frameIndex < 2; frameIndex += 1) {
        drawCharacter(
          sheet.frame(poseIndex * 2 + frameIndex, 0),
          characterId,
          direction,
          pose,
          'normal',
          false,
          frameIndex,
        );
      }
    });
    writePng(
      resolve(
        runtimeRoot,
        `${characterId}/versions/v3/base-${direction}.png`,
      ),
      sheet,
    );
  }
}

function presentationPath(characterId, name) {
  return resolve(
    runtimeRoot,
    `presentation/v3/${characterId}/${name}`,
  );
}

function generatePresentation(characterId, boss = false) {
  const menu = createSheet(32, 4, 1);
  DIRECTIONS.forEach((direction, index) => {
    drawCharacter(
      menu.frame(index, 0),
      characterId,
      direction,
      'idle',
      'normal',
      boss,
    );
  });
  writePng(presentationPath(characterId, 'menu-32.png'), menu);

  const battleSize = boss ? 64 : 48;
  const battle = createSheet(
    battleSize,
    BATTLE_POSES.length,
    boss ? BOSS_TIERS.length : 1,
  );
  const tiers = boss ? BOSS_TIERS : ['normal'];
  tiers.forEach((tier, row) => {
    BATTLE_POSES.forEach((pose, column) => {
      const direction =
        pose === 'snapping-hook' || pose === 'counter'
          ? column % 2 === 0
            ? 'left'
            : 'right'
          : 'front';
      drawCharacter(
        battle.frame(column, row),
        characterId,
        direction,
        pose,
        tier,
        boss,
      );
    });
  });
  writePng(
    presentationPath(
      characterId,
      boss ? 'battle-64.png' : 'battle-48.png',
    ),
    battle,
  );

  const showcase = createSheet(
    64,
    SHOWCASE_POSES.length,
    boss ? BOSS_TIERS.length : 1,
  );
  tiers.forEach((tier, row) => {
    SHOWCASE_POSES.forEach((pose, column) => {
      const direction = pose.startsWith('back-')
        ? 'back'
        : pose.startsWith('side-')
          ? column % 2 === 0
            ? 'left'
            : 'right'
          : 'front';
      drawCharacter(
        showcase.frame(column, row),
        characterId,
        direction,
        pose,
        tier,
        boss,
      );
    });
  });
  writePng(
    presentationPath(characterId, 'showcase-64.png'),
    showcase,
  );

  const portrait = createSheet(64, 1, 1);
  drawCharacter(
    portrait.frame(0, 0),
    characterId,
    'front',
    'boss-entrance',
    'normal',
    boss,
  );
  writePng(
    presentationPath(characterId, 'portrait-64.png'),
    portrait,
  );
}

function generateBossOverlay() {
  const overlay = createSheet(24, 5, 1);
  BOSS_TIERS.forEach((tier, index) => {
    drawPlastrong(
      overlay.frame(index, 0),
      'front',
      tier === 'defeated' ? 'fatigue' : 'boss-entrance',
      tier,
      true,
    );
  });
  writePng(
    resolve(
      runtimeRoot,
      'bosses/versions/v3/dome-warden-tiers.png',
    ),
    overlay,
  );
}

for (const characterId of CHARACTERS) {
  generateOverworld(characterId);
  generatePresentation(characterId);
}
generateBossOverlay();
generatePresentation('dome-warden', true);
