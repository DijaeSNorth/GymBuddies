import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const projectRoot = resolve(import.meta.dirname, '..');
const runtimeRoot = resolve(
  projectRoot,
  'public/assets/gym-buddies/buddies/handcrafted',
);
const reviewRoot = resolve(
  projectRoot,
  'art-source/review/batch-02-armored-heavy',
);

const COLOR = {
  outline: '#061519',
  shadow: '#0c2b2f',
  primary: '#68d39b',
  secondary: '#285057',
  detail: '#eef2d0',
  accent: '#f2c14e',
  coral: '#ef6a5b',
  review: '#18343a',
  reviewPanel: '#10292e',
};

const CHARACTERS = ['ripped-rhino', 'spotmole', 'titan-gorilla'];
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

function createSurface(width, height) {
  const pixels = Buffer.alloc(width * height * 4);
  const pixel = (x, y, color) => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= width || py >= height) return;
    const offset = (py * width + px) * 4;
    pixels.set(rgba(color), offset);
  };
  const rect = (x, y, rectWidth, rectHeight, color) => {
    for (let py = Math.round(y); py < Math.round(y + rectHeight); py += 1) {
      for (let px = Math.round(x); px < Math.round(x + rectWidth); px += 1) {
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
            px < ((px0 - cx) * (py - cy)) / (py0 - cy || 1) + cx;
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
  return { width, height, pixels, pixel, rect, polygon, line };
}

function createSheet(frameSize, columns, rows) {
  const sheet = createSurface(frameSize * columns, frameSize * rows);
  return {
    ...sheet,
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
        sheet.pixel(originX + px, originY + py, color);
      };
      const rect = (x, y, width, height, color) => {
        for (let py = Math.round(y); py < Math.round(y + height); py += 1) {
          for (let px = Math.round(x); px < Math.round(x + width); px += 1) {
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
                px < ((px0 - cx) * (py - cy)) / (py0 - cy || 1) + cx;
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
      return {
        size: frameSize,
        pixel,
        rect,
        polygon,
        line,
      };
    },
  };
}

function writePng(path, surface) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(surface.width, surface.height, surface.pixels));
  process.stdout.write(`${path}\n`);
}

function outlinedRect(frame, x, y, width, height, fill, border = 1) {
  frame.rect(x, y, width, height, COLOR.outline);
  frame.rect(
    x + border,
    y + border,
    Math.max(1, width - border * 2),
    Math.max(1, height - border * 2),
    fill,
  );
}

function outlinedPolygon(frame, outer, inner, fill) {
  frame.polygon(outer, COLOR.outline);
  frame.polygon(inner, fill);
}

function poseState(pose) {
  return {
    lifted:
      pose.includes('victory') ||
      pose.includes('double-biceps') ||
      pose === 'boss-entrance',
    drive:
      pose === 'shoulder-burst' ||
      pose === 'attack-preparation' ||
      pose === 'most-muscular',
    hook:
      pose === 'snapping-hook' ||
      pose === 'counter' ||
      pose.includes('side-'),
    low:
      pose === 'stamina-loss' ||
      pose === 'near-pin' ||
      pose === 'defeat' ||
      pose === 'fatigue-pose',
    back: pose.startsWith('back-'),
    escape: pose === 'escape',
    capture: pose === 'capture-success',
  };
}

function drawShadow(frame, state, tier) {
  const size = frame.size;
  const unit = size / 24;
  const impact =
    tier === 'overload' || tier === 'final-round' ? 1.18 : 1;
  const width = Math.round(size * 0.42 * impact);
  frame.rect(
    Math.round((size - width) / 2),
    Math.round(size - 3 * unit),
    width,
    Math.max(1, Math.round(unit)),
    COLOR.shadow,
  );
  if (tier === 'overload') {
    frame.rect(
      Math.round(size * 0.12),
      Math.round(size - 4 * unit),
      Math.round(2 * unit),
      Math.max(1, Math.round(unit)),
      COLOR.coral,
    );
    frame.rect(
      Math.round(size * 0.8),
      Math.round(size - 4 * unit),
      Math.round(2 * unit),
      Math.max(1, Math.round(unit)),
      COLOR.coral,
    );
  }
}

function drawRailhorn(frame, direction, pose, tier = 'normal', boss = false) {
  const size = frame.size;
  const u = size / 24;
  const state = poseState(pose);
  const side = direction === 'left' || direction === 'right';
  const facing = direction === 'left' ? -1 : 1;
  const low = state.low || tier === 'defeated' ? 1.1 * u : 0;
  const lift = state.lifted || tier === 'final-round' ? -u : 0;
  const open = tier === 'overload' || tier === 'final-round' ? u : 0;
  drawShadow(frame, state, tier);

  if (side) {
    const x = size / 2;
    outlinedPolygon(
      frame,
      [
        [x - 6 * u, 10 * u + low],
        [x - 4 * u, 6 * u + low],
        [x + 4 * u, 5 * u + low],
        [x + 7 * u, 10 * u + low],
        [x + 5 * u, 17 * u + low],
        [x - 5 * u, 17 * u + low],
      ],
      [
        [x - 4.7 * u, 10 * u + low],
        [x - 3 * u, 7 * u + low],
        [x + 3.5 * u, 6.5 * u + low],
        [x + 5.5 * u, 10 * u + low],
        [x + 4 * u, 16 * u + low],
        [x - 4 * u, 16 * u + low],
      ],
      COLOR.secondary,
    );
    const headX = x + facing * 4 * u;
    outlinedRect(
      frame,
      headX - 3 * u,
      5 * u + low + lift,
      6 * u,
      5 * u,
      COLOR.primary,
      Math.max(1, Math.round(u)),
    );
    frame.polygon(
      [
        [headX + facing * 2 * u, 6 * u + low + lift],
        [headX + facing * 8 * u, 7 * u + low + lift],
        [headX + facing * 2 * u, 8 * u + low + lift],
      ],
      COLOR.detail,
    );
    frame.pixel(
      headX + facing * 2 * u,
      6.5 * u + low + lift,
      COLOR.outline,
    );
    outlinedRect(
      frame,
      x - 5.5 * u - open,
      9 * u + low,
      5 * u + open,
      5 * u,
      COLOR.primary,
      Math.max(1, Math.round(u)),
    );
    outlinedRect(
      frame,
      x + 1 * u,
      11 * u + low,
      4 * u + open,
      7 * u,
      COLOR.primary,
      Math.max(1, Math.round(u)),
    );
  } else {
    const center = size / 2;
    const shoulderWidth = 16 * u + open * 2;
    outlinedPolygon(
      frame,
      [
        [center - shoulderWidth / 2, 9 * u + low],
        [center - 5 * u, 5 * u + low],
        [center + 5 * u, 5 * u + low],
        [center + shoulderWidth / 2, 9 * u + low],
        [center + 5 * u, 17 * u + low],
        [center - 5 * u, 17 * u + low],
      ],
      [
        [center - shoulderWidth / 2 + u, 9.5 * u + low],
        [center - 4 * u, 6.2 * u + low],
        [center + 4 * u, 6.2 * u + low],
        [center + shoulderWidth / 2 - u, 9.5 * u + low],
        [center + 4 * u, 16 * u + low],
        [center - 4 * u, 16 * u + low],
      ],
      COLOR.secondary,
    );
    outlinedRect(
      frame,
      center - 4 * u,
      3 * u + low + lift,
      8 * u,
      6 * u,
      COLOR.primary,
      Math.max(1, Math.round(u)),
    );
    if (!state.back && direction !== 'back') {
      frame.polygon(
        [
          [center - u, 4 * u + low + lift],
          [center, 0.8 * u + low + lift],
          [center + u, 4 * u + low + lift],
        ],
        COLOR.detail,
      );
      frame.pixel(center - 2 * u, 5 * u + low + lift, COLOR.detail);
      frame.pixel(center + 2 * u, 5 * u + low + lift, COLOR.detail);
    } else {
      frame.rect(center - 3 * u, 4 * u + low, 6 * u, u, COLOR.accent);
    }
    const armY = state.lifted ? 5 * u : state.drive ? 8 * u : 10 * u;
    outlinedRect(
      frame,
      center - 9 * u - open,
      armY + low,
      4 * u,
      state.lifted ? 6 * u : 8 * u,
      COLOR.primary,
      Math.max(1, Math.round(u)),
    );
    outlinedRect(
      frame,
      center + 5 * u + open,
      armY + low,
      4 * u,
      state.lifted ? 6 * u : 8 * u,
      COLOR.primary,
      Math.max(1, Math.round(u)),
    );
    outlinedRect(
      frame,
      center - 5 * u,
      16 * u + low,
      4 * u,
      5 * u - low,
      COLOR.primary,
      Math.max(1, Math.round(u)),
    );
    outlinedRect(
      frame,
      center + u,
      16 * u + low,
      4 * u,
      5 * u - low,
      COLOR.primary,
      Math.max(1, Math.round(u)),
    );
  }

  const seam = tier === 'overload' ? COLOR.coral : COLOR.accent;
  const seamY = Math.round(10 * u + low);
  frame.line(6 * u, seamY, 10 * u, seamY + u, seam, Math.max(1, Math.round(u)));
  frame.line(14 * u, seamY + u, 18 * u, seamY, seam, Math.max(1, Math.round(u)));
  if (size >= 48) {
    frame.line(9 * u, 13 * u + low, 12 * u, 14 * u + low, COLOR.detail);
    frame.line(12 * u, 14 * u + low, 15 * u, 13 * u + low, COLOR.detail);
  }
  if (boss) {
    const beltY = Math.round(15 * u + low);
    frame.rect(6 * u, beltY, 12 * u, Math.max(1, 2 * u), COLOR.outline);
    frame.rect(7 * u, beltY, 10 * u, Math.max(1, u), COLOR.accent);
    frame.rect(10.5 * u, beltY - u, 3 * u, 3 * u, COLOR.detail);
    frame.rect(3 * u, 9 * u + low, 3 * u, 3 * u, COLOR.outline);
    frame.rect(18 * u, 9 * u + low, 3 * u, 3 * u, COLOR.outline);
    if (tier === 'pumped' || tier === 'overload' || tier === 'final-round') {
      frame.line(7 * u, 7 * u + low, 11 * u, 9 * u + low, seam);
      frame.line(17 * u, 7 * u + low, 13 * u, 9 * u + low, seam);
    }
    if (tier === 'final-round') {
      frame.rect(4 * u, 5 * u, 2 * u, 7 * u, COLOR.coral);
      frame.rect(18 * u, 5 * u, 2 * u, 7 * u, COLOR.coral);
    }
  }
}

function drawSpotmole(frame, direction, pose) {
  const size = frame.size;
  const u = size / 24;
  const state = poseState(pose);
  const side = direction === 'left' || direction === 'right';
  const low = state.low ? u : 0;
  drawShadow(frame, state, 'normal');
  const center = size / 2;
  const width = state.drive ? 16 * u : 14 * u;
  outlinedPolygon(
    frame,
    [
      [center - width / 2, 9 * u + low],
      [center - 5 * u, 5 * u + low],
      [center + 5 * u, 5 * u + low],
      [center + width / 2, 9 * u + low],
      [center + 5 * u, 18 * u + low],
      [center - 5 * u, 18 * u + low],
    ],
    [
      [center - width / 2 + u, 9 * u + low],
      [center - 4 * u, 6 * u + low],
      [center + 4 * u, 6 * u + low],
      [center + width / 2 - u, 9 * u + low],
      [center + 4 * u, 17 * u + low],
      [center - 4 * u, 17 * u + low],
    ],
    COLOR.primary,
  );
  frame.rect(center - 6 * u, 6 * u + low, 12 * u, 3 * u, COLOR.secondary);
  const headX = side ? center + (direction === 'left' ? -2 * u : 2 * u) : center;
  outlinedRect(
    frame,
    headX - 3 * u,
    4 * u + low,
    6 * u,
    5 * u,
    COLOR.detail,
    Math.max(1, Math.round(u)),
  );
  if (direction !== 'back' && !state.back) {
    frame.rect(headX - 2 * u, 6 * u + low, 4 * u, u, COLOR.outline);
    frame.pixel(headX - u, 5 * u + low, COLOR.outline);
    frame.pixel(headX + u, 5 * u + low, COLOR.outline);
  }
  const armY = state.lifted ? 5 * u : state.hook ? 9 * u : 10 * u;
  const shovelWidth = state.drive ? 5 * u : 4 * u;
  outlinedRect(
    frame,
    center - 9 * u,
    armY + low,
    shovelWidth,
    state.lifted ? 6 * u : 7 * u,
    COLOR.secondary,
    Math.max(1, Math.round(u)),
  );
  outlinedRect(
    frame,
    center + 9 * u - shovelWidth,
    armY + low,
    shovelWidth,
    state.lifted ? 6 * u : 7 * u,
    COLOR.secondary,
    Math.max(1, Math.round(u)),
  );
  frame.rect(center - 8 * u, 13 * u + low, 3 * u, 2 * u, COLOR.accent);
  frame.rect(center + 5 * u, 13 * u + low, 3 * u, 2 * u, COLOR.accent);
  outlinedRect(frame, center - 5 * u, 17 * u + low, 4 * u, 4 * u - low, COLOR.secondary);
  outlinedRect(frame, center + u, 17 * u + low, 4 * u, 4 * u - low, COLOR.secondary);
  if (size >= 48) {
    frame.line(center - 3 * u, 11 * u, center, 13 * u, COLOR.detail);
    frame.line(center + 3 * u, 11 * u, center, 13 * u, COLOR.detail);
  }
}

function drawKnuckledge(frame, direction, pose) {
  const size = frame.size;
  const u = size / 24;
  const state = poseState(pose);
  const side = direction === 'left' || direction === 'right';
  const low = state.low ? 1.4 * u : 0;
  drawShadow(frame, state, 'normal');
  const center = size / 2;
  const shoulderWidth = state.drive ? 17 * u : 15 * u;
  outlinedPolygon(
    frame,
    [
      [center - shoulderWidth / 2, 8 * u + low],
      [center - 4 * u, 5 * u + low],
      [center + 4 * u, 5 * u + low],
      [center + shoulderWidth / 2, 8 * u + low],
      [center + 4 * u, 16 * u + low],
      [center - 4 * u, 16 * u + low],
    ],
    [
      [center - shoulderWidth / 2 + u, 8.5 * u + low],
      [center - 3 * u, 6 * u + low],
      [center + 3 * u, 6 * u + low],
      [center + shoulderWidth / 2 - u, 8.5 * u + low],
      [center + 3 * u, 15 * u + low],
      [center - 3 * u, 15 * u + low],
    ],
    COLOR.primary,
  );
  const headX = side ? center + (direction === 'left' ? -2 * u : 2 * u) : center;
  outlinedRect(frame, headX - 3 * u, 3 * u + low, 6 * u, 6 * u, COLOR.secondary);
  if (direction !== 'back' && !state.back) {
    frame.rect(headX - 2 * u, 6 * u + low, 4 * u, 2 * u, COLOR.detail);
    frame.pixel(headX - u, 5 * u + low, COLOR.detail);
    frame.pixel(headX + u, 5 * u + low, COLOR.detail);
  }
  const armTop = state.lifted ? 5 * u : 8 * u;
  const armBottom = state.lifted ? 13 * u : 19 * u - low;
  frame.line(center - 7 * u, armTop + low, center - 9 * u, armBottom, COLOR.outline, Math.max(3, Math.round(4 * u)));
  frame.line(center + 7 * u, armTop + low, center + 9 * u, armBottom, COLOR.outline, Math.max(3, Math.round(4 * u)));
  frame.line(center - 7 * u, armTop + low, center - 9 * u, armBottom, COLOR.secondary, Math.max(1, Math.round(2 * u)));
  frame.line(center + 7 * u, armTop + low, center + 9 * u, armBottom, COLOR.secondary, Math.max(1, Math.round(2 * u)));
  const fistY = state.lifted ? 4 * u : 17 * u + low;
  outlinedRect(frame, center - 11 * u, fistY, 5 * u, 4 * u, COLOR.primary, Math.max(1, Math.round(u)));
  outlinedRect(frame, center + 6 * u, fistY, 5 * u, 4 * u, COLOR.primary, Math.max(1, Math.round(u)));
  outlinedRect(frame, center - 4 * u, 15 * u + low, 3 * u, 6 * u - low, COLOR.primary);
  outlinedRect(frame, center + u, 15 * u + low, 3 * u, 6 * u - low, COLOR.primary);
  frame.rect(center - 10 * u, fistY + u, 3 * u, u, COLOR.accent);
  frame.rect(center + 7 * u, fistY + u, 3 * u, u, COLOR.accent);
  if (size >= 48) {
    frame.line(center - 4 * u, 10 * u + low, center, 12 * u + low, COLOR.detail);
    frame.line(center + 4 * u, 10 * u + low, center, 12 * u + low, COLOR.detail);
  }
}

function drawCharacter(frame, characterId, options) {
  const {
    direction = 'front',
    pose = 'neutral-battle',
    tier = 'normal',
  } = options;
  if (characterId === 'ripped-rhino') {
    drawRailhorn(frame, direction, pose, tier, false);
  } else if (characterId === 'spotmole') {
    drawSpotmole(frame, direction, pose);
  } else if (characterId === 'titan-gorilla') {
    drawKnuckledge(frame, direction, pose);
  } else {
    drawRailhorn(frame, direction, pose, tier, true);
  }
}

function overworldPose(index) {
  const pose = Math.floor(index / 2);
  if (pose === 0) return 'neutral-battle';
  if (pose === 1 || pose === 2) return index % 2 ? 'attack-preparation' : 'neutral-battle';
  if (pose === 3) return 'iron-grind';
  if (pose === 4 || pose === 5) return 'fatigue-pose';
  if (pose === 6 || pose === 7) return 'front-double-biceps';
  if (pose === 8) return 'victory-pose';
  if (pose === 9) return 'side-chest';
  if (pose === 10) return 'capture-success';
  return 'boss-entrance';
}

function generateOverworld() {
  for (const characterId of CHARACTERS) {
    for (const direction of DIRECTIONS) {
      const sheet = createSheet(24, 24, 1);
      for (let index = 0; index < 24; index += 1) {
        drawCharacter(sheet.frame(index, 0), characterId, {
          direction,
          pose: overworldPose(index),
        });
      }
      writePng(
        resolve(
          runtimeRoot,
          characterId,
          'versions/v1',
          `base-${direction}.png`,
        ),
        sheet,
      );
    }
  }

  const tiers = createSheet(24, 5, 1);
  BOSS_TIERS.forEach((tier, index) => {
    const frame = tiers.frame(index, 0);
    const u = frame.size / 24;
    if (tier === 'normal') {
      frame.rect(11 * u, 15 * u, 2 * u, 2 * u, COLOR.accent);
    } else if (tier === 'pumped') {
      frame.line(7 * u, 9 * u, 10 * u, 11 * u, COLOR.accent);
      frame.line(17 * u, 9 * u, 14 * u, 11 * u, COLOR.accent);
    } else if (tier === 'overload') {
      frame.line(5 * u, 7 * u, 10 * u, 12 * u, COLOR.coral);
      frame.line(19 * u, 7 * u, 14 * u, 12 * u, COLOR.coral);
      frame.rect(2 * u, 20 * u, 3 * u, u, COLOR.coral);
      frame.rect(19 * u, 20 * u, 3 * u, u, COLOR.coral);
    } else if (tier === 'final-round') {
      frame.rect(3 * u, 7 * u, 2 * u, 7 * u, COLOR.coral);
      frame.rect(19 * u, 7 * u, 2 * u, 7 * u, COLOR.coral);
      frame.rect(10 * u, 14 * u, 4 * u, 3 * u, COLOR.detail);
    } else if (tier === 'defeated') {
      frame.line(7 * u, 17 * u, 17 * u, 18 * u, COLOR.shadow);
    }
  });
  writePng(
    resolve(runtimeRoot, 'bosses/versions/v1/a-rhino-tiers.png'),
    tiers,
  );
}

function generatePresentation(characterId, boss = false) {
  const folder = resolve(runtimeRoot, 'presentation/v1', characterId);
  const menu = createSheet(32, 4, 1);
  DIRECTIONS.forEach((direction, index) => {
    drawCharacter(menu.frame(index, 0), characterId, {
      direction,
      pose: 'neutral-battle',
    });
  });
  writePng(resolve(folder, 'menu-32.png'), menu);

  const battleSize = boss ? 64 : 48;
  const battleRows = boss ? 5 : 1;
  const battle = createSheet(battleSize, 12, battleRows);
  for (let row = 0; row < battleRows; row += 1) {
    BATTLE_POSES.forEach((pose, column) => {
      const direction =
        pose === 'shoulder-burst' ||
        pose === 'attack-preparation' ||
        pose === 'escape'
          ? 'right'
          : pose === 'snapping-hook' || pose === 'counter'
            ? 'left'
            : pose === 'defeat'
              ? 'back'
              : 'front';
      drawCharacter(battle.frame(column, row), characterId, {
        direction,
        pose,
        tier: boss ? BOSS_TIERS[row] : 'normal',
      });
    });
  }
  writePng(resolve(folder, `battle-${battleSize}.png`), battle);

  const showcaseRows = boss ? 5 : 1;
  const showcase = createSheet(64, 10, showcaseRows);
  for (let row = 0; row < showcaseRows; row += 1) {
    SHOWCASE_POSES.forEach((pose, column) => {
      const direction = pose.startsWith('back')
        ? 'back'
        : pose === 'side-chest'
          ? 'right'
          : pose === 'side-triceps'
            ? 'left'
            : 'front';
      drawCharacter(showcase.frame(column, row), characterId, {
        direction,
        pose,
        tier: boss ? BOSS_TIERS[row] : 'normal',
      });
    });
  }
  writePng(resolve(folder, 'showcase-64.png'), showcase);

  const portrait = createSheet(64, 1, 1);
  drawCharacter(portrait.frame(0, 0), characterId, {
    direction: 'front',
    pose: boss ? 'boss-entrance' : 'victory-pose',
    tier: boss ? 'final-round' : 'normal',
  });
  writePng(resolve(folder, 'portrait-64.png'), portrait);
  return { menu, battle, showcase, portrait };
}

const FONT = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['10001', '11011', '10101', '10101', '10101'],
  N: ['1001', '1101', '1011', '1001', '1001'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  W: ['10101', '10101', '10101', '11011', '10001'],
  Y: ['101', '101', '010', '010', '010'],
  '2': ['110', '001', '010', '100', '111'],
  '0': ['010', '101', '101', '101', '010'],
  '-': ['000', '000', '111', '000', '000'],
};

function drawText(surface, text, x, y, scale = 2, color = COLOR.detail) {
  let cursor = x;
  for (const character of text.toUpperCase()) {
    if (character === ' ') {
      cursor += 4 * scale;
      continue;
    }
    const glyph = FONT[character] ?? FONT['-'];
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((value, columnIndex) => {
        if (value === '1') {
          surface.rect(
            cursor + columnIndex * scale,
            y + rowIndex * scale,
            scale,
            scale,
            color,
          );
        }
      });
    });
    cursor += (glyph[0].length + 1) * scale;
  }
}

function blitScaled(source, target, sourceX, sourceY, width, height, targetX, targetY, scale) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceOffset = ((sourceY + y) * source.width + sourceX + x) * 4;
      if (source.pixels[sourceOffset + 3] === 0) continue;
      const color = `#${[
        source.pixels[sourceOffset],
        source.pixels[sourceOffset + 1],
        source.pixels[sourceOffset + 2],
      ]
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('')}`;
      target.rect(targetX + x * scale, targetY + y * scale, scale, scale, color);
    }
  }
}

function generateContactSheet(art) {
  const contact = createSurface(1400, 820);
  contact.rect(0, 0, contact.width, contact.height, COLOR.review);
  drawText(contact, 'BATCH 02 ARMORED HEAVY REVIEW', 28, 22, 3, COLOR.accent);
  drawText(contact, 'MENU DIRECTIONS - BATTLE POSES - SHOWCASE - BOSS TIERS', 28, 52, 2);
  const rows = [
    ['RAILHORN', art['ripped-rhino'], false],
    ['SPOTMOLE', art.spotmole, false],
    ['KNUCKLEDGE', art['titan-gorilla'], false],
    ['A-RHINO BOSS', art['a-rhino'], true],
  ];
  rows.forEach(([label, sources, boss], rowIndex) => {
    const top = 92 + rowIndex * 176;
    contact.rect(20, top, 1360, 158, COLOR.reviewPanel);
    drawText(contact, label, 36, top + 14, 2, boss ? COLOR.coral : COLOR.accent);
    for (let index = 0; index < 4; index += 1) {
      blitScaled(sources.menu, contact, index * 32, 0, 32, 32, 36 + index * 74, top + 43, 2);
    }
    const sourceBattleSize = boss ? 64 : 48;
    const battleScale = boss ? 1 : 2;
    for (let index = 0; index < 6; index += 1) {
      blitScaled(
        sources.battle,
        contact,
        index * sourceBattleSize,
        boss ? 3 * sourceBattleSize : 0,
        sourceBattleSize,
        sourceBattleSize,
        350 + index * 110,
        top + 34,
        battleScale,
      );
    }
    for (let index = 0; index < 4; index += 1) {
      blitScaled(
        sources.showcase,
        contact,
        index * 64,
        boss ? index * 64 : 0,
        64,
        64,
        1030 + index * 82,
        top + 38,
        1,
      );
    }
  });
  drawText(contact, 'REVIEW STATUS - NOT FINAL', 28, 788, 2, COLOR.coral);
  writePng(resolve(reviewRoot, 'batch-02-contact-sheet.png'), contact);
}

generateOverworld();
const art = {};
for (const characterId of CHARACTERS) {
  art[characterId] = generatePresentation(characterId);
}
art['a-rhino'] = generatePresentation('a-rhino', true);
generateContactSheet(art);
