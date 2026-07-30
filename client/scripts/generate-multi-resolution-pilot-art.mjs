import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const projectRoot = resolve(import.meta.dirname, '..');
const outputRoot = resolve(
  projectRoot,
  'public/assets/gym-buddies/buddies/handcrafted/presentation/v1',
);

const COLORS = {
  outline: '#061519',
  primary: '#68d39b',
  secondary: '#285057',
  detail: '#eef2d0',
  accent: '#f2c14e',
  coral: '#ef6a5b',
  shadow: '#0c2b2f',
};

const CHARACTERS = [
  'brawny-bear',
  'iron-wolf',
  'prismantle',
  'home-watchman',
];

const DIRECTIONS = ['front', 'back', 'left', 'right'];
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
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
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
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, 255];
}

function encodePng(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0;
    pixels.copy(raw, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
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

function createSheet(frameSize, columns, rows) {
  const width = frameSize * columns;
  const height = frameSize * rows;
  const pixels = Buffer.alloc(width * height * 4);
  return {
    width,
    height,
    pixels,
    frame(column, row) {
      const originX = column * frameSize;
      const originY = row * frameSize;
      const safe = (x, y) =>
        x >= 1 && y >= 1 && x < frameSize - 1 && y < frameSize - 1;
      const pixel = (x, y, color) => {
        const px = Math.round(x);
        const py = Math.round(y);
        if (!safe(px, py)) return;
        const offset = ((originY + py) * width + originX + px) * 4;
        pixels.set(rgba(color), offset);
      };
      const rect = (x, y, rectWidth, rectHeight, color) => {
        const left = Math.round(x);
        const top = Math.round(y);
        const right = Math.round(x + rectWidth);
        const bottom = Math.round(y + rectHeight);
        for (let py = top; py < bottom; py += 1) {
          for (let px = left; px < right; px += 1) {
            pixel(px, py, color);
          }
        }
      };
      const polygon = (points, color) => {
        const minX = Math.floor(Math.min(...points.map(([x]) => x)));
        const maxX = Math.ceil(Math.max(...points.map(([x]) => x)));
        const minY = Math.floor(Math.min(...points.map(([, y]) => y)));
        const maxY = Math.ceil(Math.max(...points.map(([, y]) => y)));
        for (let py = minY; py <= maxY; py += 1) {
          for (let px = minX; px <= maxX; px += 1) {
            let inside = false;
            for (
              let current = 0, previous = points.length - 1;
              current < points.length;
              previous = current, current += 1
            ) {
              const [cx, cy] = points[current];
              const [px0, py0] = points[previous];
              const crosses =
                cy > py !== py0 > py &&
                px <
                  ((px0 - cx) * (py - cy)) / (py0 - cy || 1) + cx;
              if (crosses) inside = !inside;
            }
            if (inside) pixel(px, py, color);
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
      return { frameSize, pixel, rect, polygon, line };
    },
  };
}

function writeSheet(relativePath, sheet) {
  const output = resolve(outputRoot, relativePath);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(
    output,
    encodePng(sheet.width, sheet.height, sheet.pixels),
  );
  process.stdout.write(`${output}\n`);
}

function metrics(frame) {
  const size = frame.frameSize;
  return {
    size,
    center: size / 2,
    unit: size / 16,
    detail: size >= 64 ? 2 : 1,
    ground: size - 3,
  };
}

function poseMotion(pose, size) {
  const unit = size / 16;
  return {
    lean:
      pose === 'shoulder-burst'
        ? unit
        : pose === 'snapping-hook' || pose === 'escape'
          ? -unit
          : 0,
    crouch:
      pose === 'stamina-loss' ||
      pose === 'near-pin' ||
      pose === 'fatigue-pose' ||
      pose === 'defeat'
        ? unit
        : 0,
    armsHigh:
      pose === 'victory' ||
      pose === 'front-double-biceps' ||
      pose === 'back-double-biceps' ||
      pose === 'victory-pose',
    armsWide:
      pose === 'counter' ||
      pose === 'side-chest' ||
      pose === 'side-triceps',
    compressed:
      pose === 'iron-grind' ||
      pose === 'most-muscular' ||
      pose === 'near-pin',
  };
}

function drawShadow(frame, widthRatio = 0.5) {
  const { size, center, unit, ground } = metrics(frame);
  frame.rect(
    center - size * widthRatio * 0.5,
    ground - Math.max(1, unit * 0.35),
    size * widthRatio,
    Math.max(1, unit * 0.55),
    COLORS.shadow,
  );
}

function drawBear(frame, pose, direction = 'front', tier = 'normal') {
  const { size, center, unit, detail, ground } = metrics(frame);
  const motion = poseMotion(pose, size);
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'back';
  const facing = direction === 'right' ? 1 : -1;
  const tierMass =
    tier === 'pumped' ? unit * 0.35 : tier === 'overload' ? unit * 0.6 : 0;
  const defeated = tier === 'defeated';
  const finalRound = tier === 'final-round';
  const bodyY = unit * 5.4 + motion.crouch + (defeated ? unit * 0.7 : 0);
  const headY = unit * 1.55 + motion.crouch + (defeated ? unit * 0.7 : 0);
  const shoulderWidth = side ? unit * 4.4 : unit * 8.8 + tierMass;
  const torsoWidth = side ? unit * 4.6 : unit * 6.4 + tierMass * 0.5;
  const armLift = motion.armsHigh ? -unit * 2.2 : motion.compressed ? unit : 0;
  const armSpread = motion.armsWide ? unit * 1.2 : 0;

  drawShadow(frame, defeated ? 0.58 : 0.68);

  if (side) {
    frame.polygon(
      [
        [center - unit * 2.8 + motion.lean, bodyY],
        [center + unit * 2.2 + motion.lean, bodyY - unit * 0.5],
        [center + unit * 2.8 + motion.lean, bodyY + unit * 5.8],
        [center - unit * 2.1 + motion.lean, bodyY + unit * 6.1],
      ],
      COLORS.outline,
    );
    frame.polygon(
      [
        [center - unit * 2.3 + motion.lean, bodyY + unit * 0.3],
        [center + unit * 1.8 + motion.lean, bodyY],
        [center + unit * 2.2 + motion.lean, bodyY + unit * 5.3],
        [center - unit * 1.7 + motion.lean, bodyY + unit * 5.5],
      ],
      COLORS.secondary,
    );
  } else {
    frame.polygon(
      [
        [center - shoulderWidth / 2, bodyY],
        [center + shoulderWidth / 2, bodyY],
        [center + torsoWidth / 2, bodyY + unit * 5.5],
        [center + unit * 2.2, bodyY + unit * 7.6],
        [center - unit * 2.2, bodyY + unit * 7.6],
        [center - torsoWidth / 2, bodyY + unit * 5.5],
      ],
      COLORS.outline,
    );
    frame.polygon(
      [
        [center - shoulderWidth / 2 + detail, bodyY + detail],
        [center + shoulderWidth / 2 - detail, bodyY + detail],
        [center + torsoWidth / 2 - detail, bodyY + unit * 5.2],
        [center + unit * 1.8, bodyY + unit * 7],
        [center - unit * 1.8, bodyY + unit * 7],
        [center - torsoWidth / 2 + detail, bodyY + unit * 5.2],
      ],
      back ? COLORS.primary : COLORS.secondary,
    );
  }

  const headWidth = side ? unit * 5.2 : unit * 6.4;
  frame.polygon(
    [
      [center - headWidth / 2, headY + unit],
      [center - unit * 2.1, headY],
      [center + unit * 2.1, headY],
      [center + headWidth / 2, headY + unit],
      [center + unit * 2.6, headY + unit * 3.6],
      [center - unit * 2.6, headY + unit * 3.6],
    ],
    COLORS.outline,
  );
  frame.polygon(
    [
      [center - headWidth / 2 + detail, headY + unit],
      [center - unit * 1.9, headY + detail],
      [center + unit * 1.9, headY + detail],
      [center + headWidth / 2 - detail, headY + unit],
      [center + unit * 2.2, headY + unit * 3.2],
      [center - unit * 2.2, headY + unit * 3.2],
    ],
    COLORS.primary,
  );
  frame.rect(center - unit * 3.1, headY - unit * 0.2, unit * 1.5, unit * 1.6, COLORS.outline);
  frame.rect(center + unit * 1.6, headY - unit * 0.2, unit * 1.5, unit * 1.6, COLORS.outline);
  if (!back) {
    const muzzleX = side ? center + facing * unit * 1.5 : center;
    frame.rect(muzzleX - unit * 1.2, headY + unit * 2.1, unit * 2.4, unit * 1.5, COLORS.detail);
    frame.rect(muzzleX - detail / 2, headY + unit * 2.2, detail, detail, COLORS.outline);
    frame.rect(center - unit * 1.4, headY + unit * 1.4, detail, detail, COLORS.detail);
    if (!side) frame.rect(center + unit * 1.4 - detail, headY + unit * 1.4, detail, detail, COLORS.detail);
  } else {
    frame.line(center - unit * 2.1, headY + unit * 2.2, center + unit * 2.1, headY + unit * 2.2, COLORS.secondary, detail);
  }

  const leftArmX = side ? center - unit * 2.4 : center - shoulderWidth / 2 - unit * 0.8 - armSpread;
  const rightArmX = side ? center + unit * 1.2 : center + shoulderWidth / 2 - unit * 0.6 + armSpread;
  const actionExtension =
    pose === 'shoulder-burst' || pose === 'capture-success'
      ? unit * 2.2
      : pose === 'snapping-hook'
        ? unit * 1.3
        : 0;
  frame.rect(leftArmX - actionExtension, bodyY + unit * 0.7 + armLift, unit * 2.2 + actionExtension, unit * 5.1, COLORS.outline);
  frame.rect(leftArmX + detail - actionExtension, bodyY + unit + armLift, unit * 1.7 + actionExtension, unit * 4.5, COLORS.primary);
  frame.rect(rightArmX, bodyY + unit * 0.7 - (pose === 'counter' ? unit : 0) + armLift, unit * 2.2 + actionExtension, unit * 5.1, COLORS.outline);
  frame.rect(rightArmX + detail, bodyY + unit - (pose === 'counter' ? unit : 0) + armLift, unit * 1.7 + actionExtension, unit * 4.5, COLORS.primary);

  const legY = bodyY + unit * 7;
  const stance = motion.compressed ? unit * 1.2 : unit * 2.3;
  frame.polygon(
    [
      [center - stance - unit * 1.5, legY],
      [center - stance + unit * 0.8, legY],
      [center - stance + unit * 1.4, ground],
      [center - stance - unit * 1.5, ground],
    ],
    COLORS.outline,
  );
  frame.polygon(
    [
      [center + stance - unit * 0.8, legY],
      [center + stance + unit * 1.5, legY],
      [center + stance + unit * 1.5, ground],
      [center + stance - unit * 1.4, ground],
    ],
    COLORS.outline,
  );
  frame.rect(center - stance - unit, legY + detail, unit * 1.5, ground - legY - detail, COLORS.primary);
  frame.rect(center + stance - unit * 0.5, legY + detail, unit * 1.5, ground - legY - detail, COLORS.primary);

  const definitionY = bodyY + unit * 2.1;
  frame.line(center - unit * 2.2, definitionY, center - unit * 0.4, definitionY + unit * 0.6, COLORS.primary, detail);
  frame.line(center + unit * 2.2, definitionY, center + unit * 0.4, definitionY + unit * 0.6, COLORS.primary, detail);
  frame.line(center, definitionY + unit, center, definitionY + unit * 4.2, COLORS.primary, detail);

  if (tier !== 'normal') drawBossTierEffects(frame, tier, pose);
  if (finalRound) {
    frame.line(center - unit * 4.5, unit * 2, center - unit * 3.5, unit * 0.8, COLORS.accent, detail);
    frame.line(center + unit * 4.5, unit * 2, center + unit * 3.5, unit * 0.8, COLORS.accent, detail);
  }
}

function drawWolf(frame, pose, direction = 'front') {
  const { size, center, unit, detail, ground } = metrics(frame);
  const motion = poseMotion(pose, size);
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'back';
  const facing = direction === 'right' ? 1 : -1;
  const bodyY = unit * 5.2 + motion.crouch;

  drawShadow(frame, 0.62);

  const shoulder = side ? unit * 4.4 : unit * 7.4;
  frame.polygon(
    [
      [center - shoulder / 2 + motion.lean, bodyY],
      [center + shoulder / 2 + motion.lean, bodyY],
      [center + unit * 2.2 + motion.lean, bodyY + unit * 6.8],
      [center - unit * 1.8 + motion.lean, bodyY + unit * 6.8],
    ],
    COLORS.outline,
  );
  frame.polygon(
    [
      [center - shoulder / 2 + detail + motion.lean, bodyY + detail],
      [center + shoulder / 2 - detail + motion.lean, bodyY + detail],
      [center + unit * 1.8 + motion.lean, bodyY + unit * 6.2],
      [center - unit * 1.4 + motion.lean, bodyY + unit * 6.2],
    ],
    back ? COLORS.primary : COLORS.secondary,
  );

  const headY = unit * 1.2 + motion.crouch;
  frame.polygon(
    [
      [center - unit * 2.6, headY + unit * 1.2],
      [center - unit * 1.8, headY - unit * 0.4],
      [center - unit * 0.6, headY + unit * 0.5],
      [center + unit * 0.7, headY + unit * 0.5],
      [center + unit * 2, headY - unit * 0.4],
      [center + unit * 2.8, headY + unit * 2.8],
      [center + unit * 1.5, headY + unit * 4],
      [center - unit * 1.8, headY + unit * 4],
    ],
    COLORS.outline,
  );
  frame.polygon(
    [
      [center - unit * 2.1, headY + unit * 1.3],
      [center - unit * 1.6, headY + unit * 0.2],
      [center - unit * 0.5, headY + unit],
      [center + unit * 0.6, headY + unit],
      [center + unit * 1.7, headY + unit * 0.2],
      [center + unit * 2.3, headY + unit * 2.6],
      [center + unit * 1.2, headY + unit * 3.5],
      [center - unit * 1.5, headY + unit * 3.5],
    ],
    COLORS.primary,
  );
  if (!back) {
    const muzzleX = side ? center + facing * unit * 2 : center;
    frame.polygon(
      [
        [muzzleX - unit * 1.1, headY + unit * 2.2],
        [muzzleX + unit * 1.8 * facing, headY + unit * 2.5],
        [muzzleX + unit * 1.2 * facing, headY + unit * 3.5],
        [muzzleX - unit * 1.1, headY + unit * 3.3],
      ],
      COLORS.detail,
    );
    frame.rect(muzzleX + facing * unit - detail / 2, headY + unit * 2.5, detail, detail, COLORS.outline);
    frame.rect(center - unit, headY + unit * 1.8, detail, detail, COLORS.accent);
    if (!side) frame.rect(center + unit - detail, headY + unit * 1.8, detail, detail, COLORS.accent);
  }

  const armLift = motion.armsHigh ? -unit * 1.8 : 0;
  const stride = pose === 'escape' ? unit * 1.2 : 0;
  frame.polygon(
    [
      [center - unit * 3.8 - stride, bodyY + unit + armLift],
      [center - unit * 1.9, bodyY + unit],
      [center - unit * 2.4, bodyY + unit * 7.5],
      [center - unit * 4.2 - stride, bodyY + unit * 7.5],
    ],
    COLORS.outline,
  );
  frame.polygon(
    [
      [center + unit * 1.9, bodyY + unit],
      [center + unit * 3.8 + stride, bodyY + unit + armLift],
      [center + unit * 4.2 + stride, bodyY + unit * 7.5],
      [center + unit * 2.4, bodyY + unit * 7.5],
    ],
    COLORS.outline,
  );
  frame.rect(center - unit * 3.5 - stride, bodyY + unit * 1.4 + armLift, unit * 1.4, unit * 5.6, COLORS.primary);
  frame.rect(center + unit * 2.1 + stride, bodyY + unit * 1.4 + armLift, unit * 1.4, unit * 5.6, COLORS.primary);

  frame.polygon(
    [
      [center - unit * 1.7, bodyY + unit * 6],
      [center - unit * 0.1, bodyY + unit * 6],
      [center - unit * 0.8, ground],
      [center - unit * 2.6, ground],
    ],
    COLORS.primary,
  );
  frame.polygon(
    [
      [center + unit * 0.1, bodyY + unit * 6],
      [center + unit * 1.8, bodyY + unit * 6],
      [center + unit * 2.8, ground],
      [center + unit, ground],
    ],
    COLORS.primary,
  );
  const tailStartX = side ? center + unit * 1.5 : center + unit * 2;
  const tailDirection = direction === 'right' ? -1 : 1;
  frame.line(
    tailStartX,
    bodyY + unit * 5.2,
    tailStartX + tailDirection * unit * 4.2,
    bodyY + unit * (pose === 'victory' ? 2.5 : 7),
    COLORS.outline,
    Math.max(2, detail + 1),
  );
  frame.line(
    center - unit * 2.4,
    bodyY + unit * 1.8,
    center + unit * 2,
    bodyY + unit * 2.6,
    COLORS.primary,
    detail,
  );
  frame.line(center, bodyY + unit * 2.5, center, bodyY + unit * 5.5, COLORS.primary, detail);
  drawActionEffects(frame, pose);
}

function drawPrism(frame, pose, direction = 'front') {
  const { size, center, unit, detail, ground } = metrics(frame);
  const motion = poseMotion(pose, size);
  const back = direction === 'back';
  const side = direction === 'left' || direction === 'right';
  const right = direction === 'right';
  const bodyY = unit * 3.1 + motion.crouch;
  const spread =
    motion.armsHigh || motion.armsWide || pose === 'shoulder-burst'
      ? unit * 2
      : motion.compressed
        ? -unit
        : 0;

  drawShadow(frame, 0.56);
  frame.polygon(
    [
      [center, bodyY],
      [center + unit * 3.8, bodyY + unit * 3.8],
      [center + unit * 2.2, bodyY + unit * 9.2],
      [center, bodyY + unit * 11],
      [center - unit * 2.5, bodyY + unit * 9.2],
      [center - unit * 3.8, bodyY + unit * 3.8],
    ],
    COLORS.outline,
  );
  frame.polygon(
    [
      [center, bodyY + detail],
      [center + unit * 3.3, bodyY + unit * 4],
      [center + unit * 1.8, bodyY + unit * 8.8],
      [center, bodyY + unit * 10.3],
      [center - unit * 2, bodyY + unit * 8.8],
      [center - unit * 3.3, bodyY + unit * 4],
    ],
    back ? COLORS.secondary : COLORS.primary,
  );
  frame.polygon(
    [
      [center, bodyY + unit * 2],
      [center + unit * 1.9, bodyY + unit * 4.7],
      [center + unit * 0.8, bodyY + unit * 8],
      [center - unit * 0.8, bodyY + unit * 8],
      [center - unit * 1.9, bodyY + unit * 4.7],
    ],
    COLORS.accent,
  );

  const leftWing = [
    [center - unit * 2.5, bodyY + unit * 3],
    [center - unit * 7.1 - spread, bodyY + unit * 1.5],
    [center - unit * 6.1 - spread, bodyY + unit * 6.2],
    [center - unit * 3, bodyY + unit * 7.5],
  ];
  const rightWing = [
    [center + unit * 2.4, bodyY + unit * 3.3],
    [center + unit * 6.4 + spread, bodyY + unit * 0.6],
    [center + unit * 7.3 + spread, bodyY + unit * 5.4],
    [center + unit * 3, bodyY + unit * 7.2],
  ];
  const firstWing = right ? rightWing : leftWing;
  const secondWing = right ? leftWing : rightWing;
  frame.polygon(firstWing, COLORS.outline);
  frame.polygon(secondWing, COLORS.outline);
  frame.polygon(
    firstWing.map(([x, y]) => [x + (x < center ? detail : -detail), y + detail]),
    COLORS.primary,
  );
  frame.polygon(
    secondWing.map(([x, y]) => [x + (x < center ? detail : -detail), y + detail]),
    COLORS.secondary,
  );
  if (side) {
    frame.line(
      center + (right ? unit * 1.5 : -unit * 1.5),
      bodyY + unit,
      center + (right ? unit * 5 : -unit * 5),
      bodyY - unit * 0.4,
      COLORS.accent,
      detail,
    );
  } else {
    frame.line(center, bodyY - unit * 0.3, center, bodyY - unit * 2, COLORS.accent, detail);
  }
  frame.rect(center - unit * 2.2, ground - unit * 1.3, unit * 1.6, unit * 1.3, COLORS.detail);
  frame.rect(center + unit * 0.6, ground - unit * 1.3, unit * 1.6, unit * 1.3, COLORS.detail);
  frame.line(center - unit * 2.1, bodyY + unit * 5, center + unit * 2, bodyY + unit * 5, COLORS.detail, detail);
  frame.line(center, bodyY + unit * 2, center, bodyY + unit * 9, COLORS.detail, detail);
  drawActionEffects(frame, pose);
}

function drawActionEffects(frame, pose) {
  const { size, center, unit, detail } = metrics(frame);
  if (pose === 'shoulder-burst') {
    frame.line(center + unit * 4.5, unit * 6, center + unit * 7, unit * 5, COLORS.coral, detail);
    frame.line(center + unit * 4.8, unit * 7.5, center + unit * 7.4, unit * 7.5, COLORS.accent, detail);
  } else if (pose === 'iron-grind') {
    frame.line(center - unit * 5, unit * 10, center + unit * 5, unit * 10, COLORS.accent, detail);
    frame.line(center - unit * 4, unit * 11.2, center + unit * 4, unit * 11.2, COLORS.secondary, detail);
  } else if (pose === 'snapping-hook') {
    frame.line(center - unit * 6, unit * 5, center - unit * 3.5, unit * 7.5, COLORS.coral, detail);
    frame.line(center - unit * 6.2, unit * 7, center - unit * 4.8, unit * 8.5, COLORS.accent, detail);
  } else if (pose === 'counter') {
    frame.line(center - unit * 5.5, unit * 4.5, center - unit * 4, unit * 3, COLORS.accent, detail);
    frame.line(center + unit * 5.5, unit * 4.5, center + unit * 4, unit * 3, COLORS.accent, detail);
  } else if (pose === 'capture-success') {
    frame.rect(center - detail, unit * 1.5, detail * 2, detail * 2, COLORS.accent);
    frame.rect(center - unit * 3, unit * 2.8, detail, detail, COLORS.detail);
    frame.rect(center + unit * 3, unit * 2.2, detail, detail, COLORS.detail);
  } else if (pose === 'escape') {
    frame.line(center - unit * 6, unit * 8, center - unit * 8, unit * 8, COLORS.detail, detail);
    frame.line(center - unit * 5, unit * 10, center - unit * 7.5, unit * 10, COLORS.detail, detail);
  } else if (pose === 'victory' || pose === 'victory-pose') {
    frame.rect(center - unit * 4, unit * 1.5, detail, detail, COLORS.accent);
    frame.rect(center + unit * 4, unit * 1.2, detail, detail, COLORS.accent);
  }
  if (size >= 64 && pose === 'abs-and-thigh') {
    frame.line(center - unit, unit * 8, center + unit, unit * 8, COLORS.detail, detail);
  }
}

function drawBossTierEffects(frame, tier, pose) {
  const { center, unit, detail } = metrics(frame);
  if (tier === 'pumped') {
    frame.line(center - unit * 5, unit * 4, center - unit * 4, unit * 2.5, COLORS.accent, detail);
    frame.line(center + unit * 5, unit * 4, center + unit * 4, unit * 2.5, COLORS.accent, detail);
  } else if (tier === 'overload') {
    frame.line(center - unit * 6, unit * 6, center - unit * 4.5, unit * 4, COLORS.coral, detail + 1);
    frame.line(center + unit * 6, unit * 6, center + unit * 4.5, unit * 4, COLORS.coral, detail + 1);
    frame.rect(center - unit * 4.8, unit * 9, unit * 1.2, unit * 3.5, COLORS.accent);
    frame.rect(center + unit * 3.6, unit * 9, unit * 1.2, unit * 3.5, COLORS.accent);
  } else if (tier === 'final-round') {
    frame.line(center - unit * 6, unit * 3, center, unit * 0.8, COLORS.accent, detail);
    frame.line(center, unit * 0.8, center + unit * 6, unit * 3, COLORS.accent, detail);
    frame.rect(center - unit * 2.8, unit * 10.5, unit * 5.6, unit, COLORS.coral);
  } else if (tier === 'defeated') {
    frame.line(center - unit * 4, unit * 5, center + unit * 4, unit * 5, COLORS.secondary, detail);
    frame.rect(center + unit * 4.8, unit * 7, detail, detail, COLORS.detail);
    frame.rect(center + unit * 5.8, unit * 8.2, detail, detail, COLORS.detail);
  }
  if (pose === 'defeat') {
    frame.line(center - unit * 3, unit * 12, center + unit * 3, unit * 12, COLORS.secondary, detail);
  }
}

function drawWatchmanEquipment(frame, tier) {
  const { center, unit, detail } = metrics(frame);
  const haloY = tier === 'defeated' ? unit * 4 : unit * 1.4;
  frame.line(center - unit * 3.5, haloY, center + unit * 3.5, haloY, COLORS.accent, detail + 1);
  frame.rect(center - unit * 4.8, unit * 8.4, unit * 1.3, unit * 4.5, COLORS.accent);
  frame.rect(center + unit * 3.5, unit * 8.4, unit * 1.3, unit * 4.5, COLORS.accent);
  frame.line(center - unit * 2.8, unit * 7, center + unit * 2.8, unit * 12, COLORS.detail, detail);
  frame.line(center + unit * 2.8, unit * 7, center - unit * 2.8, unit * 12, COLORS.detail, detail);
  frame.rect(center - unit * 3.1, unit * 12.2, unit * 6.2, unit * 1.2, COLORS.accent);
}

function drawCharacter(frame, characterId, pose, direction, tier = 'normal') {
  if (characterId === 'iron-wolf') {
    drawWolf(frame, pose, direction);
    return;
  }
  if (characterId === 'prismantle') {
    drawPrism(frame, pose, direction);
    return;
  }
  drawBear(frame, pose, direction, tier);
  if (characterId === 'home-watchman') {
    drawWatchmanEquipment(frame, tier);
  } else {
    drawActionEffects(frame, pose);
  }
}

function generateMenu(characterId) {
  const sheet = createSheet(32, DIRECTIONS.length, 1);
  DIRECTIONS.forEach((direction, column) => {
    drawCharacter(
      sheet.frame(column, 0),
      characterId,
      'front-relaxed',
      direction,
      'normal',
    );
  });
  writeSheet(`${characterId}/menu-32.png`, sheet);
}

function generateBattle(characterId) {
  const boss = characterId === 'home-watchman';
  const frameSize = boss ? 64 : 48;
  const rows = boss ? BOSS_TIERS.length : 1;
  const sheet = createSheet(frameSize, BATTLE_POSES.length, rows);
  for (let row = 0; row < rows; row += 1) {
    const tier = boss ? BOSS_TIERS[row] : 'normal';
    BATTLE_POSES.forEach((pose, column) => {
      drawCharacter(
        sheet.frame(column, row),
        characterId,
        pose,
        'front',
        tier,
      );
    });
  }
  writeSheet(`${characterId}/battle-${frameSize}.png`, sheet);
}

function generateShowcase(characterId) {
  const boss = characterId === 'home-watchman';
  const rows = boss ? BOSS_TIERS.length : 1;
  const sheet = createSheet(64, SHOWCASE_POSES.length, rows);
  for (let row = 0; row < rows; row += 1) {
    const tier = boss ? BOSS_TIERS[row] : 'normal';
    SHOWCASE_POSES.forEach((pose, column) => {
      const direction =
        pose === 'back-relaxed' || pose === 'back-double-biceps'
          ? 'back'
          : pose === 'side-chest' || pose === 'side-triceps'
            ? 'left'
            : 'front';
      drawCharacter(
        sheet.frame(column, row),
        characterId,
        pose,
        direction,
        tier,
      );
    });
  }
  writeSheet(`${characterId}/showcase-64.png`, sheet);
}

function generatePortrait(characterId) {
  const sheet = createSheet(64, 1, 1);
  drawCharacter(
    sheet.frame(0, 0),
    characterId,
    'front-relaxed',
    'front',
    'normal',
  );
  writeSheet(`${characterId}/portrait-64.png`, sheet);
}

for (const characterId of CHARACTERS) {
  generateMenu(characterId);
  generateBattle(characterId);
  generateShowcase(characterId);
  generatePortrait(characterId);
}
