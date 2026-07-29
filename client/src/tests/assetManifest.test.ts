import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  BOSS_ASSET_KEYS,
  BUDDY_ASSET_KEYS,
  CONTENT_ASSET_REFERENCES,
  MACHINE_ASSET_KEYS,
} from '../game/assets/contentBindings';
import {
  ASSET_BY_KEY,
  ASSET_MANIFEST,
  getAssetStandard,
} from '../game/assets/manifest';
import { joinAssetUrl } from '../game/assets/assetUrl';
import {
  applyPaletteSwap,
  createTrainerPaletteMap,
  TRAINER_PALETTE_MARKERS,
} from '../game/assets/paletteSwap';
import { validateAssetManifest } from '../game/assets/validation';
import { BOSS_ROSTERS } from '../game/content/bosses';
import { BUDDY_SPECIES } from '../game/content/buddies';
import { ALL_TRAINING_MACHINES } from '../game/content/machines';

const publicAssetRoot = join(process.cwd(), 'public', ASSET_MANIFEST.basePath);

function readPngDimensions(buffer: Buffer) {
  expect(buffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

describe('asset manifest', () => {
  it('has valid stable keys, categories, standards, paths, and palette references', () => {
    expect(validateAssetManifest(ASSET_MANIFEST)).toEqual([]);
    expect(ASSET_BY_KEY.size).toBe(ASSET_MANIFEST.assets.length);
  });

  it('contains every declared content binding and binds only known content ids', () => {
    CONTENT_ASSET_REFERENCES.forEach((key) => expect(ASSET_BY_KEY.has(key)).toBe(true));

    const buddyIds = new Set(BUDDY_SPECIES.map((species) => species.id));
    Object.keys(BUDDY_ASSET_KEYS).forEach((id) => expect(buddyIds.has(id)).toBe(true));

    const machineIds = new Set(ALL_TRAINING_MACHINES.map((machine) => machine.id));
    Object.keys(MACHINE_ASSET_KEYS).forEach((id) => expect(machineIds.has(id)).toBe(true));

    const bossIds = new Set(BOSS_ROSTERS.flatMap((roster) => roster.bosses.map((boss) => boss.id)));
    Object.keys(BOSS_ASSET_KEYS).forEach((id) => expect(bossIds.has(id)).toBe(true));
  });

  it('finds every manifest file and verifies sheet dimensions or WAV headers', () => {
    ASSET_MANIFEST.assets.forEach((asset) => {
      const filePath = join(publicAssetRoot, asset.path);
      expect(existsSync(filePath), `Missing ${asset.key}: ${filePath}`).toBe(true);
      const file = readFileSync(filePath);
      const standard = getAssetStandard(asset);

      if (standard.mediaType === 'image') {
        expect(readPngDimensions(file), asset.key).toEqual({
          width: standard.frameWidth * standard.columns,
          height: standard.frameHeight * standard.rows,
        });
      } else {
        expect(file.subarray(0, 4).toString('ascii'), asset.key).toBe('RIFF');
        expect(file.subarray(8, 12).toString('ascii'), asset.key).toBe('WAVE');
        expect(file.readUInt32LE(24), asset.key).toBe(standard.sampleRate);
      }
    });
  });

  it('joins application, manifest, and asset paths without damaging URL protocols', () => {
    expect(
      joinAssetUrl(
        '/GymBuddies/',
        'assets/gym-buddies',
        'audio/ui-confirm.wav',
      ),
    ).toBe('/GymBuddies/assets/gym-buddies/audio/ui-confirm.wav');
    expect(
      joinAssetUrl(
        'https://cdn.example.test/GymBuddies/',
        '/assets/gym-buddies/',
        '/trainer/overworld-base.png',
      ),
    ).toBe(
      'https://cdn.example.test/GymBuddies/assets/gym-buddies/trainer/overworld-base.png',
    );
  });

  it('replaces exact trainer palette markers without changing alpha or unrelated colors', () => {
    const pixels = new Uint8ClampedArray([
      242, 195, 139, 255,
      1, 2, 3, 255,
      242, 195, 139, 0,
    ]);
    const target = {
      ...TRAINER_PALETTE_MARKERS,
      skin: '#123456',
    };
    const swapped = applyPaletteSwap(pixels, createTrainerPaletteMap(target));

    expect([...swapped]).toEqual([
      18, 52, 86, 255,
      1, 2, 3, 255,
      242, 195, 139, 0,
    ]);
    expect([...pixels]).toEqual([
      242, 195, 139, 255,
      1, 2, 3, 255,
      242, 195, 139, 0,
    ]);
  });
});
