import { deflateSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const clientRoot = resolve(import.meta.dirname, '..');
const manifestPath = join(clientRoot, 'src', 'game', 'assets', 'asset-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const outputRoot = join(clientRoot, 'public', manifest.basePath);
const force = process.argv.includes('--force');

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
    const targetOffset = y * (width * 4 + 1);
    scanlines[targetOffset] = 0;
    rgba.copy(scanlines, targetOffset + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    signature,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function rgba(hex, alpha = 255) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, alpha];
}

function createSurface(width, height) {
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
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = color[3] ?? 255;
    },
    rect(x, y, rectWidth, rectHeight, color) {
      for (let py = y; py < y + rectHeight; py += 1) {
        for (let px = x; px < x + rectWidth; px += 1) this.pixel(px, py, color);
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

function hashKey(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function drawTrainer(surface, standard, palette) {
  const slot = Object.fromEntries(
    Object.entries(palette.slots).map(([key, value]) => [key, rgba(value)]),
  );
  for (let row = 0; row < standard.rows; row += 1) {
    for (let column = 0; column < standard.columns; column += 1) {
      const ox = column * standard.frameWidth;
      const oy = row * standard.frameHeight;
      const step = column === 0 ? 0 : column === 1 ? -1 : 1;
      surface.rect(ox + 5, oy + 3, 6, 5, slot.outline);
      surface.rect(ox + 6, oy + 4, 4, 4, slot.skin);
      surface.rect(ox + 5, oy + 3, 6, 2, slot.hair);
      surface.rect(ox + 4, oy + 8, 8, 5, slot.outline);
      surface.rect(ox + 5, oy + 8, 6, 4, slot.top);
      surface.rect(ox + 3, oy + 9, 2, 3, slot.skin);
      surface.rect(ox + 11, oy + 9, 2, 3, slot.glove);
      surface.rect(ox + 5 + Math.min(0, step), oy + 13, 3, 2, slot.shoes);
      surface.rect(ox + 8 + Math.max(0, step), oy + 13, 3, 2, slot.shoes);
      const facingMarkX = row === 1 ? 5 : row === 2 ? 10 : 7;
      const facingMarkY = row === 3 ? 4 : 7;
      surface.pixel(ox + facingMarkX, oy + facingMarkY, slot.highlight);
    }
  }
}

function drawBuddyOverworld(surface, standard, colors, seed) {
  const outline = colors[0];
  const core = colors[5];
  const accent = seed % 2 ? colors[6] : colors[7];
  const detail = colors[4];
  for (let frame = 0; frame < standard.frameCount; frame += 1) {
    const ox = frame * standard.frameWidth;
    const lift = frame % 2;
    const widthBias = seed % 3;
    surface.rect(ox + 4 - widthBias, 6 - lift, 8 + widthBias * 2, 7, outline);
    surface.rect(ox + 5 - widthBias, 5 - lift, 6 + widthBias * 2, 7, core);
    surface.rect(ox + 3, 9 - lift, 3, 4, core);
    surface.rect(ox + 10, 9 - lift, 3, 4, core);
    surface.rect(ox + 5, 12, 3, 2, accent);
    surface.rect(ox + 9, 12, 3, 2, accent);
    surface.pixel(ox + 6, 7 - lift, detail);
    surface.pixel(ox + 10, 7 - lift, detail);
    if (seed % 2 === 0) {
      surface.line(ox + 5, 5 - lift, ox + 3, 3 - lift, accent);
      surface.line(ox + 11, 5 - lift, ox + 13, 3 - lift, accent);
    } else {
      surface.rect(ox + 7, 3 - lift, 3, 3, accent);
    }
  }
}

function drawPortrait(surface, standard, colors, seed, boss = false) {
  const width = standard.frameWidth;
  const height = standard.frameHeight;
  const outline = colors[0];
  const core = boss ? colors[6] : colors[5];
  const accent = boss ? colors[7] : colors[6];
  const detail = colors[4];
  const centerX = Math.floor(width / 2);
  const bodyTop = boss ? 12 : 10;
  surface.rect(centerX - 15, bodyTop + 8, 30, height - bodyTop - 12, outline);
  surface.rect(centerX - 13, bodyTop + 6, 26, height - bodyTop - 12, core);
  surface.rect(centerX - 10, bodyTop, 20, 15, outline);
  surface.rect(centerX - 8, bodyTop + 2, 16, 12, core);
  surface.rect(centerX - 7, bodyTop + 7, 4, 3, detail);
  surface.rect(centerX + 3, bodyTop + 7, 4, 3, detail);
  surface.rect(centerX - 4, bodyTop + 12, 8, 2, accent);
  const shoulder = 5 + (seed % 6);
  surface.rect(2, bodyTop + 14, shoulder + 8, 10, accent);
  surface.rect(width - shoulder - 10, bodyTop + 14, shoulder + 8, 10, accent);
  if (boss) {
    for (let point = 0; point < 8; point += 1) {
      const x = centerX + Math.round(Math.cos((point / 8) * Math.PI * 2) * 25);
      const y = Math.floor(height / 2) + Math.round(Math.sin((point / 8) * Math.PI * 2) * 25);
      surface.rect(x - 2, y - 2, 4, 4, colors[7]);
    }
  }
}

function drawMachine(surface, standard, colors, seed) {
  for (let frame = 0; frame < standard.frameCount; frame += 1) {
    const ox = frame * standard.frameWidth;
    const travel = frame <= 2 ? frame : 1;
    surface.rect(ox + 3, 3, 2, 19, colors[2]);
    surface.rect(ox + 11, 3, 2, 19, colors[2]);
    surface.rect(ox + 3, 3, 10, 2, colors[3]);
    surface.rect(ox + 5, 18, 6, 4, colors[0]);
    surface.rect(ox + 5, 17, 6, 2, colors[5]);
    if (seed % 2 === 0) {
      surface.rect(ox + 5, 7 + travel, 6, 2, colors[6]);
      surface.pixel(ox + 4, 8 + travel, colors[7]);
      surface.pixel(ox + 11, 8 + travel, colors[7]);
    } else {
      surface.line(ox + 5, 5, ox + 7, 11 + travel, colors[7]);
      surface.line(ox + 11, 5, ox + 9, 11 + travel, colors[7]);
      surface.rect(ox + 7, 11 + travel, 3, 3, colors[6]);
    }
  }
}

function drawTiles(surface, standard, colors, seed) {
  for (let frame = 0; frame < standard.frameCount; frame += 1) {
    const column = frame % standard.columns;
    const row = Math.floor(frame / standard.columns);
    const ox = column * standard.frameWidth;
    const oy = row * standard.frameHeight;
    surface.rect(ox, oy, 8, 8, frame % 2 ? colors[1] : colors[2]);
    if ((frame + seed) % 3 === 0) {
      for (let pixel = 0; pixel < 8; pixel += 2) surface.pixel(ox + pixel, oy + pixel, colors[5]);
    } else if ((frame + seed) % 3 === 1) {
      surface.line(ox, oy + 4, ox + 7, oy + 4, colors[3]);
      surface.pixel(ox + 3, oy + 3, colors[7]);
    } else {
      surface.rect(ox + 2, oy + 2, 4, 4, colors[0]);
      surface.rect(ox + 3, oy + 3, 2, 2, colors[6]);
    }
  }
}

function drawIcons(surface, standard, colors, seed) {
  for (let frame = 0; frame < standard.frameCount; frame += 1) {
    const ox = frame * standard.frameWidth;
    const accent = colors[5 + ((frame + seed) % 3)];
    surface.rect(ox + 1, 1, 6, 6, colors[0]);
    surface.line(ox + 2, 4, ox + 4, 2, accent);
    surface.line(ox + 4, 2, ox + 6, 4, accent);
    surface.line(ox + 6, 4, ox + 4, 6, accent);
    surface.line(ox + 4, 6, ox + 2, 4, accent);
    surface.pixel(ox + 4, 4, colors[4]);
  }
}

function drawEffect(surface, standard, colors, seed) {
  const center = 8;
  for (let frame = 0; frame < standard.frameCount; frame += 1) {
    const ox = frame * standard.frameWidth;
    const radius = 1 + frame;
    const accent = seed % 2 ? colors[6] : colors[7];
    surface.pixel(ox + center, center, colors[4]);
    surface.line(ox + center - radius, center, ox + center + radius, center, accent);
    surface.line(ox + center, center - radius, ox + center, center + radius, accent);
    if (frame > 1) {
      surface.pixel(ox + center - radius + 1, center - radius + 1, colors[5]);
      surface.pixel(ox + center + radius - 1, center + radius - 1, colors[5]);
      surface.pixel(ox + center + radius - 1, center - radius + 1, colors[5]);
      surface.pixel(ox + center - radius + 1, center + radius - 1, colors[5]);
    }
  }
}

function generateImage(asset, standard, palette) {
  const width = standard.frameWidth * standard.columns;
  const height = standard.frameHeight * standard.rows;
  const surface = createSurface(width, height);
  const colors = palette.colors.map((color) => rgba(color));
  const seed = hashKey(asset.key);
  if (asset.standardId === 'trainer-overworld') drawTrainer(surface, standard, palette);
  else if (asset.standardId === 'buddy-overworld') drawBuddyOverworld(surface, standard, colors, seed);
  else if (asset.standardId === 'battle-portrait') drawPortrait(surface, standard, colors, seed);
  else if (asset.standardId === 'boss-portrait') drawPortrait(surface, standard, colors, seed, true);
  else if (asset.standardId === 'machine-animation') drawMachine(surface, standard, colors, seed);
  else if (asset.standardId === 'environment-tiles') drawTiles(surface, standard, colors, seed);
  else if (asset.standardId === 'ui-icons') drawIcons(surface, standard, colors, seed);
  else if (asset.standardId === 'effect-animation') drawEffect(surface, standard, colors, seed);
  else throw new Error(`No placeholder renderer for standard "${asset.standardId}".`);
  return encodePng(width, height, surface.pixels);
}

function generateWav(asset, standard) {
  const sampleCount = Math.max(1, Math.round((asset.durationMs / 1000) * standard.sampleRate));
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(standard.sampleRate, 24);
  buffer.writeUInt32LE(standard.sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  const seed = hashKey(asset.key);
  const baseFrequency = 160 + (seed % 5) * 42;
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const progress = sample / sampleCount;
    const envelope = Math.pow(1 - progress, 2);
    const frequency = baseFrequency * (progress > 0.55 ? 1.5 : 1);
    const tone = Math.sin((sample / standard.sampleRate) * Math.PI * 2 * frequency);
    const tick = sample % Math.max(1, Math.round(standard.sampleRate / 900)) === 0 ? 0.18 : 0;
    const value = Math.max(-1, Math.min(1, (tone * 0.2 + tick) * envelope));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + sample * 2);
  }
  return buffer;
}

let generated = 0;
let skipped = 0;
for (const asset of manifest.assets) {
  if (asset.status !== 'placeholder') continue;
  const outputPath = join(outputRoot, asset.path);
  if (existsSync(outputPath) && !force) {
    skipped += 1;
    continue;
  }
  const standard = manifest.standards[asset.standardId];
  if (!standard) throw new Error(`Missing standard "${asset.standardId}" for "${asset.key}".`);
  mkdirSync(dirname(outputPath), { recursive: true });
  const file =
    standard.mediaType === 'image'
      ? generateImage(asset, standard, manifest.palettes[asset.paletteId])
      : generateWav(asset, standard);
  writeFileSync(outputPath, file);
  generated += 1;
}

process.stdout.write(
  `Gym Buddies placeholders: generated ${generated}, preserved ${skipped}.`
    + `${force ? ' Forced regeneration was enabled.' : ''}\n`,
);
