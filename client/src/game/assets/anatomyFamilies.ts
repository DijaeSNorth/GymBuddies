import type { BuddyAnatomyFamilyId } from './types';

export type SpritePoint = Readonly<{ x: number; y: number }>;

export type BuddyAnatomyFamily = Readonly<{
  id: BuddyAnatomyFamilyId;
  label: string;
  canvas: Readonly<{ width: 24; height: 24 }>;
  pivot: SpritePoint;
  groundLineY: number;
  headZone: Readonly<{ x: number; y: number; width: number; height: number }>;
  bodyZone: Readonly<{ x: number; y: number; width: number; height: number }>;
  backZone: Readonly<{ x: number; y: number; width: number; height: number }>;
  coreZone: Readonly<{ x: number; y: number; width: number; height: number }>;
  limbAnchors: Readonly<Record<string, SpritePoint>>;
  accessoryAnchors: Readonly<Record<string, SpritePoint>>;
  appendageAnchors: Readonly<Record<string, SpritePoint>>;
  effectAnchors: Readonly<Record<string, SpritePoint>>;
  safeDeformation: Readonly<{
    horizontalPx: number;
    verticalPx: number;
    notes: string;
  }>;
}>;

function family(
  value: Omit<BuddyAnatomyFamily, 'canvas' | 'pivot' | 'groundLineY'> &
    Partial<Pick<BuddyAnatomyFamily, 'pivot' | 'groundLineY'>>,
): BuddyAnatomyFamily {
  return {
    canvas: { width: 24, height: 24 },
    pivot: value.pivot ?? { x: 12, y: 21 },
    groundLineY: value.groundLineY ?? 21,
    ...value,
  };
}

export const BUDDY_ANATOMY_FAMILIES: readonly BuddyAnatomyFamily[] = [
  family({
    id: 'broad-mammal',
    label: 'Broad mammal',
    headZone: { x: 7, y: 2, width: 10, height: 7 },
    bodyZone: { x: 4, y: 8, width: 16, height: 10 },
    backZone: { x: 4, y: 8, width: 16, height: 5 },
    coreZone: { x: 8, y: 11, width: 8, height: 7 },
    limbAnchors: {
      frontLeft: { x: 5, y: 13 },
      frontRight: { x: 19, y: 13 },
      rearLeft: { x: 7, y: 19 },
      rearRight: { x: 17, y: 19 },
    },
    accessoryAnchors: {
      head: { x: 12, y: 3 },
      neck: { x: 12, y: 8 },
      waist: { x: 12, y: 16 },
      hands: { x: 5, y: 16 },
      knees: { x: 8, y: 19 },
    },
    appendageAnchors: {
      earLeft: { x: 8, y: 3 },
      earRight: { x: 16, y: 3 },
      tail: { x: 19, y: 15 },
    },
    effectAnchors: {
      pump: { x: 12, y: 10 },
      rare: { x: 18, y: 5 },
      boss: { x: 12, y: 2 },
    },
    safeDeformation: {
      horizontalPx: 2,
      verticalPx: 1,
      notes: 'Widen shoulder, back, forelimb, and haunch modules independently.',
    },
  }),
  family({
    id: 'lean-quadruped',
    label: 'Lean quadruped',
    headZone: { x: 7, y: 3, width: 10, height: 6 },
    bodyZone: { x: 5, y: 9, width: 14, height: 8 },
    backZone: { x: 5, y: 9, width: 14, height: 4 },
    coreZone: { x: 9, y: 12, width: 6, height: 5 },
    limbAnchors: {
      frontLeft: { x: 7, y: 14 },
      frontRight: { x: 17, y: 14 },
      rearLeft: { x: 8, y: 18 },
      rearRight: { x: 16, y: 18 },
    },
    accessoryAnchors: {
      head: { x: 12, y: 3 },
      neck: { x: 12, y: 9 },
      waist: { x: 12, y: 15 },
      hands: { x: 7, y: 17 },
      knees: { x: 8, y: 19 },
    },
    appendageAnchors: {
      earLeft: { x: 9, y: 3 },
      earRight: { x: 15, y: 3 },
      tail: { x: 19, y: 14 },
      muzzle: { x: 12, y: 8 },
    },
    effectAnchors: {
      pump: { x: 12, y: 11 },
      rare: { x: 18, y: 5 },
      boss: { x: 12, y: 2 },
    },
    safeDeformation: {
      horizontalPx: 2,
      verticalPx: 2,
      notes: 'Keep the waist narrow while varying shoulder, back, and leg modules.',
    },
  }),
  family({
    id: 'armored-shelled',
    label: 'Armored or shelled',
    headZone: { x: 8, y: 5, width: 8, height: 5 },
    bodyZone: { x: 3, y: 8, width: 18, height: 10 },
    backZone: { x: 3, y: 7, width: 18, height: 7 },
    coreZone: { x: 7, y: 11, width: 10, height: 7 },
    limbAnchors: {
      frontLeft: { x: 5, y: 16 },
      frontRight: { x: 19, y: 16 },
      rearLeft: { x: 7, y: 19 },
      rearRight: { x: 17, y: 19 },
    },
    accessoryAnchors: {
      head: { x: 12, y: 5 },
      neck: { x: 12, y: 9 },
      waist: { x: 12, y: 16 },
      hands: { x: 5, y: 17 },
      knees: { x: 7, y: 19 },
    },
    appendageAnchors: {
      shell: { x: 12, y: 10 },
      crest: { x: 12, y: 4 },
      tail: { x: 20, y: 16 },
    },
    effectAnchors: {
      pump: { x: 12, y: 12 },
      rare: { x: 17, y: 7 },
      boss: { x: 12, y: 3 },
    },
    safeDeformation: {
      horizontalPx: 2,
      verticalPx: 1,
      notes: 'Deform armor plates as modules; never stretch the shell raster.',
    },
  }),
  family({
    id: 'compact-powerhouse',
    label: 'Compact powerhouse',
    headZone: { x: 8, y: 3, width: 8, height: 6 },
    bodyZone: { x: 5, y: 8, width: 14, height: 10 },
    backZone: { x: 5, y: 8, width: 14, height: 5 },
    coreZone: { x: 8, y: 11, width: 8, height: 7 },
    limbAnchors: {
      armLeft: { x: 5, y: 13 },
      armRight: { x: 19, y: 13 },
      legLeft: { x: 8, y: 19 },
      legRight: { x: 16, y: 19 },
    },
    accessoryAnchors: {
      head: { x: 12, y: 3 },
      neck: { x: 12, y: 8 },
      waist: { x: 12, y: 16 },
      hands: { x: 5, y: 16 },
      knees: { x: 8, y: 19 },
    },
    appendageAnchors: {
      crest: { x: 12, y: 3 },
      tail: { x: 19, y: 16 },
    },
    effectAnchors: {
      pump: { x: 12, y: 11 },
      rare: { x: 17, y: 5 },
      boss: { x: 12, y: 2 },
    },
    safeDeformation: {
      horizontalPx: 2,
      verticalPx: 1,
      notes: 'Favor dense limb modules and a stable bottom-center silhouette.',
    },
  }),
  family({
    id: 'winged-mythic',
    label: 'Winged mythic',
    headZone: { x: 8, y: 3, width: 8, height: 6 },
    bodyZone: { x: 7, y: 8, width: 10, height: 9 },
    backZone: { x: 5, y: 8, width: 14, height: 5 },
    coreZone: { x: 9, y: 10, width: 6, height: 7 },
    limbAnchors: {
      wingLeft: { x: 5, y: 10 },
      wingRight: { x: 19, y: 10 },
      legLeft: { x: 9, y: 19 },
      legRight: { x: 15, y: 19 },
    },
    accessoryAnchors: {
      head: { x: 12, y: 3 },
      neck: { x: 12, y: 8 },
      waist: { x: 12, y: 16 },
      hands: { x: 6, y: 13 },
      knees: { x: 9, y: 19 },
    },
    appendageAnchors: {
      wingLeft: { x: 6, y: 9 },
      wingRight: { x: 18, y: 9 },
      crest: { x: 12, y: 3 },
      tail: { x: 12, y: 18 },
    },
    effectAnchors: {
      pump: { x: 12, y: 11 },
      rare: { x: 19, y: 6 },
      boss: { x: 12, y: 2 },
    },
    safeDeformation: {
      horizontalPx: 3,
      verticalPx: 2,
      notes: 'Replace wing, crest, and torso modules; preserve the central flight silhouette.',
    },
  }),
  family({
    id: 'serpentine',
    label: 'Serpentine',
    headZone: { x: 8, y: 2, width: 8, height: 6 },
    bodyZone: { x: 6, y: 7, width: 12, height: 13 },
    backZone: { x: 7, y: 7, width: 10, height: 7 },
    coreZone: { x: 7, y: 10, width: 10, height: 8 },
    limbAnchors: {
      coilLeft: { x: 6, y: 18 },
      coilRight: { x: 18, y: 18 },
      clasp: { x: 12, y: 20 },
    },
    accessoryAnchors: {
      head: { x: 12, y: 2 },
      neck: { x: 12, y: 7 },
      waist: { x: 12, y: 15 },
      hands: { x: 7, y: 13 },
      knees: { x: 8, y: 19 },
    },
    appendageAnchors: {
      crest: { x: 12, y: 2 },
      coil: { x: 12, y: 17 },
      tail: { x: 17, y: 20 },
    },
    effectAnchors: {
      pump: { x: 12, y: 12 },
      rare: { x: 17, y: 5 },
      boss: { x: 12, y: 1 },
    },
    safeDeformation: {
      horizontalPx: 2,
      verticalPx: 2,
      notes: 'Shift coil segments individually; keep the ground clasp on the anchor.',
    },
  }),
  family({
    id: 'multi-limbed',
    label: 'Multi-limbed',
    headZone: { x: 8, y: 2, width: 8, height: 6 },
    bodyZone: { x: 7, y: 7, width: 10, height: 11 },
    backZone: { x: 6, y: 7, width: 12, height: 6 },
    coreZone: { x: 9, y: 10, width: 6, height: 8 },
    limbAnchors: {
      upperLeft: { x: 5, y: 10 },
      upperRight: { x: 19, y: 10 },
      lowerLeft: { x: 5, y: 15 },
      lowerRight: { x: 19, y: 15 },
      legLeft: { x: 9, y: 19 },
      legRight: { x: 15, y: 19 },
    },
    accessoryAnchors: {
      head: { x: 12, y: 2 },
      neck: { x: 12, y: 7 },
      waist: { x: 12, y: 16 },
      hands: { x: 5, y: 13 },
      knees: { x: 9, y: 19 },
    },
    appendageAnchors: {
      upperArms: { x: 12, y: 10 },
      lowerArms: { x: 12, y: 15 },
      crest: { x: 12, y: 2 },
    },
    effectAnchors: {
      pump: { x: 12, y: 11 },
      rare: { x: 18, y: 5 },
      boss: { x: 12, y: 1 },
    },
    safeDeformation: {
      horizontalPx: 3,
      verticalPx: 1,
      notes: 'Treat each limb pair as a separate authored module and keep overlap readable.',
    },
  }),
  family({
    id: 'avian',
    label: 'Avian',
    headZone: { x: 8, y: 2, width: 8, height: 6 },
    bodyZone: { x: 7, y: 8, width: 10, height: 10 },
    backZone: { x: 6, y: 8, width: 12, height: 5 },
    coreZone: { x: 9, y: 10, width: 6, height: 7 },
    limbAnchors: {
      wingLeft: { x: 6, y: 11 },
      wingRight: { x: 18, y: 11 },
      legLeft: { x: 9, y: 19 },
      legRight: { x: 15, y: 19 },
    },
    accessoryAnchors: {
      head: { x: 12, y: 2 },
      neck: { x: 12, y: 8 },
      waist: { x: 12, y: 16 },
      hands: { x: 6, y: 14 },
      knees: { x: 9, y: 19 },
    },
    appendageAnchors: {
      beak: { x: 12, y: 6 },
      wingLeft: { x: 6, y: 10 },
      wingRight: { x: 18, y: 10 },
      tail: { x: 12, y: 18 },
    },
    effectAnchors: {
      pump: { x: 12, y: 11 },
      rare: { x: 18, y: 5 },
      boss: { x: 12, y: 1 },
    },
    safeDeformation: {
      horizontalPx: 3,
      verticalPx: 2,
      notes: 'Author wing-span and keel variants; never scale the complete bird.',
    },
  }),
  family({
    id: 'heavy-biped',
    label: 'Heavy biped',
    headZone: { x: 8, y: 2, width: 8, height: 6 },
    bodyZone: { x: 5, y: 7, width: 14, height: 11 },
    backZone: { x: 5, y: 7, width: 14, height: 6 },
    coreZone: { x: 8, y: 10, width: 8, height: 8 },
    limbAnchors: {
      armLeft: { x: 5, y: 12 },
      armRight: { x: 19, y: 12 },
      legLeft: { x: 8, y: 19 },
      legRight: { x: 16, y: 19 },
    },
    accessoryAnchors: {
      head: { x: 12, y: 2 },
      neck: { x: 12, y: 7 },
      waist: { x: 12, y: 16 },
      hands: { x: 5, y: 15 },
      knees: { x: 8, y: 19 },
    },
    appendageAnchors: {
      crest: { x: 12, y: 2 },
      tail: { x: 19, y: 16 },
    },
    effectAnchors: {
      pump: { x: 12, y: 10 },
      rare: { x: 18, y: 5 },
      boss: { x: 12, y: 1 },
    },
    safeDeformation: {
      horizontalPx: 2,
      verticalPx: 2,
      notes: 'Swap shoulder, torso, forearm, and leg blocks while preserving the foot line.',
    },
  }),
];

export const BUDDY_ANATOMY_FAMILY_BY_ID = new Map(
  BUDDY_ANATOMY_FAMILIES.map((entry) => [entry.id, entry]),
);

export function getBuddyAnatomyFamily(id: BuddyAnatomyFamilyId) {
  const value = BUDDY_ANATOMY_FAMILY_BY_ID.get(id);
  if (!value) throw new Error(`Unknown Buddy anatomy family "${id}".`);
  return value;
}
