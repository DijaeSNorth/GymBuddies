export interface TrainerPaletteSwap {
  outline: string;
  hair: string;
  skin: string;
  top: string;
  shoes: string;
  glove: string;
  highlight: string;
}

export const TRAINER_PALETTE_MARKERS: TrainerPaletteSwap = {
  outline: '#061519',
  hair: '#18343a',
  skin: '#f2c38b',
  top: '#ef6a5b',
  shoes: '#285057',
  glove: '#68d39b',
  highlight: '#eef2d0',
};

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbKey(red: number, green: number, blue: number) {
  return `${red},${green},${blue}`;
}

export function createTrainerPaletteMap(
  target: TrainerPaletteSwap,
): Map<string, [number, number, number]> {
  const swaps = new Map<string, [number, number, number]>();
  (Object.keys(TRAINER_PALETTE_MARKERS) as Array<keyof TrainerPaletteSwap>).forEach((slot) => {
    swaps.set(rgbKey(...hexToRgb(TRAINER_PALETTE_MARKERS[slot])), hexToRgb(target[slot]));
  });
  return swaps;
}

export function applyPaletteSwap(
  source: Uint8ClampedArray,
  swaps: ReadonlyMap<string, readonly [number, number, number]>,
) {
  const result = new Uint8ClampedArray(source);
  for (let index = 0; index < result.length; index += 4) {
    if (result[index + 3] === 0) continue;
    const replacement = swaps.get(rgbKey(result[index], result[index + 1], result[index + 2]));
    if (!replacement) continue;
    result[index] = replacement[0];
    result[index + 1] = replacement[1];
    result[index + 2] = replacement[2];
  }
  return result;
}
