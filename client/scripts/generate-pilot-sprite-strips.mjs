import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const FRAME = 24;
const POSES = 12;
const FRAMES_PER_POSE = 2;
const outputRoot = resolve(
  import.meta.dirname,
  '..',
  'public',
  'assets',
  'gym-buddies',
  'buddies',
  'handcrafted',
);

const COLOR = {
  outline: '#061519',
  primary: '#68d39b',
  secondary: '#285057',
  detail: '#eef2d0',
  accent: '#f2c14e',
  transparent: '#00000000',
};

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    scanlines[rowOffset] = 0;
    rgba.copy(
      scanlines,
      rowOffset + 1,
      y * width * 4,
      (y + 1) * width * 4,
    );
  }
  return Buffer.concat([
    signature,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function rgba(hex) {
  const normalized = hex.replace('#', '');
  if (normalized.length === 8) {
    const value = Number.parseInt(normalized, 16);
    return [
      (value >> 24) & 255,
      (value >> 16) & 255,
      (value >> 8) & 255,
      value & 255,
    ];
  }
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, 255];
}

function surface(width, height) {
  const pixels = Buffer.alloc(width * height * 4);
  return {
    width,
    height,
    pixels,
    pixel(x, y, color) {
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 0 || py < 0 || px >= width || py >= height) return;
      const offset = (py * width + px) * 4;
      const value = rgba(color);
      pixels[offset] = value[0];
      pixels[offset + 1] = value[1];
      pixels[offset + 2] = value[2];
      pixels[offset + 3] = value[3];
    },
    rect(x, y, rectWidth, rectHeight, color) {
      for (let py = y; py < y + rectHeight; py += 1) {
        for (let px = x; px < x + rectWidth; px += 1) {
          this.pixel(px, py, color);
        }
      }
    },
    line(x0, y0, x1, y1, color) {
      let x = x0;
      let y = y0;
      const dx = Math.abs(x1 - x0);
      const sx = x0 < x1 ? 1 : -1;
      const dy = -Math.abs(y1 - y0);
      const sy = y0 < y1 ? 1 : -1;
      let error = dx + dy;
      while (true) {
        this.pixel(x, y, color);
        if (x === x1 && y === y1) break;
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
    },
  };
}

function rect(frame, x, y, width, height, color) {
  frame.rect(x, y, width, height, color);
}

function poseMetrics(pose, animationFrame) {
  const bounce =
    pose === 1 || pose === 2 || pose === 10 || pose === 11
      ? animationFrame === 0
        ? 0
        : -1
      : 0;
  return {
    bounce,
    armLift:
      pose === 6 || pose === 7 || pose === 8 || pose === 10 || pose === 11
        ? 3
        : pose === 3 || pose === 5
          ? 1
          : 0,
    crouch: pose === 4 ? 2 : pose === 5 ? 1 : 0,
    stride: pose === 1 || pose === 2 ? (animationFrame === 0 ? -1 : 1) : 0,
  };
}

function drawBear(frame, direction, pose, animationFrame) {
  const metrics = poseMetrics(pose, animationFrame);
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'back';
  const y = metrics.bounce + metrics.crouch;
  const torsoX = side ? 8 : 6;
  const torsoWidth = side ? 9 : 12;
  const shoulderX = side ? 7 : 4;
  const shoulderWidth = side ? 11 : 16;

  rect(frame, 8, 3 + y, 8, 6, COLOR.outline);
  rect(frame, 9, 4 + y, 6, 5, COLOR.primary);
  rect(frame, side ? 9 : 7, 2 + y, 3, 3, COLOR.outline);
  rect(frame, side ? 10 : 14, 2 + y, 3, 3, COLOR.outline);
  rect(frame, side ? 10 : 8, 3 + y, 2, 2, COLOR.primary);
  rect(frame, side ? 10 : 15, 3 + y, 2, 2, COLOR.primary);
  if (!back) {
    rect(frame, side ? 8 : 10, 6 + y, side ? 5 : 4, 3, COLOR.detail);
    frame.pixel(side ? 9 : 11, 6 + y, COLOR.outline);
  } else {
    rect(frame, 10, 5 + y, 4, 1, COLOR.secondary);
  }

  rect(frame, shoulderX, 8 + y, shoulderWidth, 6, COLOR.outline);
  rect(frame, torsoX, 8 + y, torsoWidth, 9, COLOR.primary);
  rect(frame, side ? 10 : 8, 9 + y, side ? 5 : 8, 3, COLOR.secondary);
  if (back) {
    rect(frame, 8, 9 + y, 8, 2, COLOR.secondary);
    rect(frame, 10, 11 + y, 4, 4, COLOR.primary);
  } else {
    rect(frame, side ? 9 : 9, 10 + y, side ? 6 : 6, 2, COLOR.detail);
    rect(frame, side ? 11 : 11, 12 + y, 2, 4, COLOR.secondary);
  }

  const leftArmY = 11 + y - metrics.armLift;
  const rightArmY = pose === 9 ? 10 + y : leftArmY;
  if (side) {
    rect(frame, direction === 'left' ? 5 : 15, leftArmY, 5, 6, COLOR.outline);
    rect(frame, direction === 'left' ? 6 : 16, leftArmY, 3, 5, COLOR.primary);
    rect(frame, direction === 'left' ? 5 : 15, 15 + y, 5, 3, COLOR.secondary);
  } else {
    rect(frame, 3, leftArmY, 5, 7, COLOR.outline);
    rect(frame, 16, rightArmY, 5, 7, COLOR.outline);
    rect(frame, 4, leftArmY, 3, 6, COLOR.primary);
    rect(frame, 17, rightArmY, 3, 6, COLOR.primary);
    rect(frame, 3, 15 + y - metrics.armLift, 5, 3, COLOR.secondary);
    rect(frame, 16, 15 + y - metrics.armLift, 5, 3, COLOR.secondary);
  }

  rect(frame, 7 + metrics.stride, 16 + y, 5, 5 - metrics.crouch, COLOR.outline);
  rect(frame, 13 - metrics.stride, 16 + y, 5, 5 - metrics.crouch, COLOR.outline);
  rect(frame, 8 + metrics.stride, 16 + y, 3, 4 - metrics.crouch, COLOR.primary);
  rect(frame, 14 - metrics.stride, 16 + y, 3, 4 - metrics.crouch, COLOR.primary);
  rect(frame, 6 + metrics.stride, 20, 6, 2, COLOR.outline);
  rect(frame, 13 - metrics.stride, 20, 6, 2, COLOR.outline);

  if (pose === 3) {
    rect(frame, 5, 5 + y, 14, 2, COLOR.accent);
    rect(frame, 6, 4 + y, 2, 2, COLOR.outline);
    rect(frame, 16, 4 + y, 2, 2, COLOR.outline);
  }
  if (pose === 6 || pose === 10 || pose === 11) {
    frame.pixel(4, 6 + y, COLOR.accent);
    frame.pixel(19, 6 + y, COLOR.accent);
  }
}

function drawWolf(frame, direction, pose, animationFrame) {
  const metrics = poseMetrics(pose, animationFrame);
  const side = direction === 'left' || direction === 'right';
  const back = direction === 'back';
  const y = metrics.bounce + metrics.crouch;

  rect(frame, 9, 3 + y, 7, 6, COLOR.outline);
  rect(frame, 10, 4 + y, 5, 5, COLOR.primary);
  rect(frame, side ? 10 : 9, 2 + y, 2, 3, COLOR.outline);
  rect(frame, side ? 13 : 14, 2 + y, 2, 3, COLOR.outline);
  frame.pixel(side ? 10 : 9, 3 + y, COLOR.accent);
  frame.pixel(side ? 13 : 14, 3 + y, COLOR.accent);
  if (!back) {
    rect(
      frame,
      direction === 'right' ? 14 : side ? 6 : 8,
      6 + y,
      side ? 5 : 8,
      3,
      COLOR.detail,
    );
    frame.pixel(direction === 'right' ? 17 : side ? 6 : 10, 6 + y, COLOR.outline);
  }

  rect(frame, side ? 8 : 6, 8 + y, side ? 9 : 12, 8, COLOR.outline);
  rect(frame, side ? 9 : 7, 8 + y, side ? 7 : 10, 7, COLOR.primary);
  rect(frame, side ? 10 : 8, 9 + y, side ? 5 : 8, 2, COLOR.secondary);
  if (!back) {
    rect(frame, side ? 10 : 9, 10 + y, side ? 4 : 6, 5, COLOR.detail);
    rect(frame, side ? 11 : 11, 11 + y, 2, 4, COLOR.secondary);
  } else {
    rect(frame, 8, 10 + y, 8, 2, COLOR.secondary);
    rect(frame, 10, 12 + y, 4, 3, COLOR.primary);
  }

  const armY = 10 + y - metrics.armLift;
  if (side) {
    rect(frame, direction === 'left' ? 5 : 15, armY, 4, 7, COLOR.outline);
    rect(frame, direction === 'left' ? 6 : 16, armY, 2, 6, COLOR.primary);
    rect(frame, direction === 'left' ? 5 : 15, 15 + y, 4, 3, COLOR.secondary);
  } else {
    rect(frame, 4, armY, 4, 7, COLOR.outline);
    rect(frame, 16, armY, 4, 7, COLOR.outline);
    rect(frame, 5, armY, 2, 6, COLOR.primary);
    rect(frame, 17, armY, 2, 6, COLOR.primary);
    rect(frame, 4, 15 + y - metrics.armLift, 4, 3, COLOR.secondary);
    rect(frame, 16, 15 + y - metrics.armLift, 4, 3, COLOR.secondary);
  }

  rect(frame, 8 + metrics.stride, 15 + y, 4, 6 - metrics.crouch, COLOR.outline);
  rect(frame, 13 - metrics.stride, 15 + y, 4, 6 - metrics.crouch, COLOR.outline);
  rect(frame, 9 + metrics.stride, 16 + y, 2, 4 - metrics.crouch, COLOR.primary);
  rect(frame, 14 - metrics.stride, 16 + y, 2, 4 - metrics.crouch, COLOR.primary);
  rect(frame, 7 + metrics.stride, 20, 5, 2, COLOR.outline);
  rect(frame, 13 - metrics.stride, 20, 5, 2, COLOR.outline);

  const tailLeft = direction === 'right' ? 5 : 17;
  frame.line(tailLeft, 13 + y, direction === 'right' ? 2 : 21, 17 + y, COLOR.outline);
  frame.pixel(direction === 'right' ? 3 : 20, 16 + y, COLOR.accent);
  if (pose === 3) {
    rect(frame, 5, 8 + y, 3, 3, COLOR.accent);
    rect(frame, 16, 8 + y, 3, 3, COLOR.accent);
  }
}

function drawPrism(frame, direction, pose, animationFrame) {
  const metrics = poseMetrics(pose, animationFrame);
  const y = metrics.bounce + Math.floor(metrics.crouch / 2);
  const right = direction === 'right';
  const back = direction === 'back';
  const side = direction === 'left' || direction === 'right';
  const centerX = side ? (right ? 13 : 11) : 12;

  frame.line(centerX, 2 + y, centerX - 5, 11 + y, COLOR.outline);
  frame.line(centerX - 5, 11 + y, centerX, 18 + y, COLOR.outline);
  frame.line(centerX, 18 + y, centerX + 5, 11 + y, COLOR.outline);
  frame.line(centerX + 5, 11 + y, centerX, 2 + y, COLOR.outline);
  rect(frame, centerX - 3, 5 + y, 7, 10, COLOR.primary);
  frame.line(centerX, 5 + y, centerX - 3, 11 + y, COLOR.detail);
  frame.line(centerX, 5 + y, centerX + 3, 11 + y, COLOR.secondary);
  frame.line(centerX - 3, 11 + y, centerX, 15 + y, COLOR.secondary);
  frame.line(centerX + 3, 11 + y, centerX, 15 + y, COLOR.detail);
  rect(frame, centerX - 1, 8 + y, 3, 3, COLOR.accent);

  const lift = metrics.armLift;
  const leftSpan = side ? 4 : 6;
  const rightSpan = side ? 5 : 7;
  frame.line(centerX - 3, 7 + y, centerX - leftSpan, 6 + y - lift, COLOR.outline);
  frame.line(centerX - 4, 8 + y, centerX - leftSpan - 2, 11 + y - lift, COLOR.primary);
  frame.line(centerX + 3, 7 + y, centerX + rightSpan, 5 + y - lift, COLOR.outline);
  frame.line(centerX + 4, 8 + y, centerX + rightSpan + 2, 9 + y - lift, COLOR.secondary);
  frame.pixel(centerX - leftSpan, 6 + y - lift, COLOR.accent);
  frame.pixel(centerX + rightSpan, 5 + y - lift, COLOR.accent);

  frame.line(centerX - 2, 17 + y, centerX - 5 + metrics.stride, 21, COLOR.outline);
  frame.line(centerX + 2, 17 + y, centerX + 5 - metrics.stride, 21, COLOR.outline);
  rect(frame, centerX - 6 + metrics.stride, 20, 4, 2, COLOR.secondary);
  rect(frame, centerX + 3 - metrics.stride, 20, 4, 2, COLOR.secondary);

  if (back) {
    rect(frame, centerX - 2, 8 + y, 5, 5, COLOR.secondary);
    frame.line(centerX - 2, 8 + y, centerX + 2, 12 + y, COLOR.detail);
  }
  if (right) {
    frame.pixel(centerX + 8, 6 + y - lift, COLOR.detail);
    frame.pixel(centerX + 7, 5 + y - lift, COLOR.accent);
  }
  if (pose === 10 || pose === 11) {
    frame.pixel(3, 4 + y, COLOR.accent);
    frame.pixel(20, 6 + y, COLOR.detail);
  }
}

function drawDirectionStrip(speciesId, direction, drawFrame) {
  const strip = surface(FRAME * POSES * FRAMES_PER_POSE, FRAME);
  for (let pose = 0; pose < POSES; pose += 1) {
    for (let animationFrame = 0; animationFrame < FRAMES_PER_POSE; animationFrame += 1) {
      const frame = surface(FRAME, FRAME);
      drawFrame(frame, direction, pose, animationFrame);
      const targetFrame = pose * FRAMES_PER_POSE + animationFrame;
      for (let y = 0; y < FRAME; y += 1) {
        const sourceStart = y * FRAME * 4;
        const targetStart =
          (y * strip.width + targetFrame * FRAME) * 4;
        frame.pixels.copy(
          strip.pixels,
          targetStart,
          sourceStart,
          sourceStart + FRAME * 4,
        );
      }
    }
  }
  const path = join(outputRoot, speciesId, `base-${direction}.png`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(strip.width, strip.height, strip.pixels));
  return path;
}

function drawBossTierOverlay() {
  const strip = surface(FRAME * 5, FRAME);
  for (let tier = 0; tier < 5; tier += 1) {
    const frame = surface(FRAME, FRAME);
    if (tier !== 4) {
      frame.line(7, 8, 4, 5, COLOR.accent);
      frame.line(17, 8, 20, 5, COLOR.accent);
      rect(frame, 10, 1, 4, 2, COLOR.accent);
      rect(frame, 9, 3, 6, 1, COLOR.secondary);
      rect(frame, 5, 14, 3, 4, COLOR.secondary);
      rect(frame, 16, 14, 3, 4, COLOR.secondary);
    }
    if (tier >= 1 && tier <= 3) {
      frame.pixel(3, 10, COLOR.detail);
      frame.pixel(21, 10, COLOR.detail);
    }
    if (tier === 2) {
      frame.line(2, 8, 2, 14, COLOR.accent);
      frame.line(21, 8, 21, 14, COLOR.accent);
      frame.pixel(12, 1, COLOR.detail);
    }
    if (tier === 3) {
      frame.line(3, 4, 6, 2, COLOR.detail);
      frame.line(18, 2, 21, 4, COLOR.detail);
      frame.line(4, 18, 2, 20, COLOR.accent);
      frame.line(20, 18, 22, 20, COLOR.accent);
    }
    if (tier === 4) {
      rect(frame, 7, 18, 10, 2, COLOR.secondary);
      frame.line(8, 17, 5, 20, COLOR.detail);
    }
    for (let y = 0; y < FRAME; y += 1) {
      const sourceStart = y * FRAME * 4;
      const targetStart = (y * strip.width + tier * FRAME) * 4;
      frame.pixels.copy(
        strip.pixels,
        targetStart,
        sourceStart,
        sourceStart + FRAME * 4,
      );
    }
  }
  const path = join(outputRoot, 'bosses', 'home-watchman-tiers.png');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(strip.width, strip.height, strip.pixels));
  return path;
}

const outputs = [
  drawDirectionStrip('brawny-bear', 'front', drawBear),
  drawDirectionStrip('brawny-bear', 'back', drawBear),
  drawDirectionStrip('brawny-bear', 'left', drawBear),
  drawDirectionStrip('iron-wolf', 'front', drawWolf),
  drawDirectionStrip('iron-wolf', 'back', drawWolf),
  drawDirectionStrip('iron-wolf', 'left', drawWolf),
  drawDirectionStrip('prismantle', 'front', drawPrism),
  drawDirectionStrip('prismantle', 'back', drawPrism),
  drawDirectionStrip('prismantle', 'left', drawPrism),
  drawDirectionStrip('prismantle', 'right', drawPrism),
  drawBossTierOverlay(),
];

for (const output of outputs) {
  console.log(output);
}
