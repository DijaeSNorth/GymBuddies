import type {
  BossPresentationTier,
  BuddyCosmetics,
  BuddyFacingDirection,
} from '../types';
import { normalizeBuddyCosmetics } from '../systems/buddyCosmetics';

export type Batch03SpeciesId =
  | 'titan-tortoise'
  | 'ripped-rhino'
  | 'boulder-bison';

export type Batch03PhysiqueKind =
  | 'compact'
  | 'balanced'
  | 'broad'
  | 'specialized'
  | 'species-specific';

export const PLASTRONG_DOME_LAYER_IDS = [
  'upper-dome',
  'front-plastron',
  'shoulder-openings',
  'hip-openings',
  'neck-opening',
  'flexible-joint-tissue',
  'exposed-limb-musculature',
  'shell-seams',
  'equipment-mounts',
  'pump-highlights',
  'rare-trait-effects',
] as const;
export type PlastrongDomeLayerId =
  (typeof PLASTRONG_DOME_LAYER_IDS)[number];

export type Batch03AnatomyFamily =
  | 'complete-domed-shell'
  | 'low-profile-armored'
  | 'rigid-torso-exposed-limbs';

export type Batch03DomeModule = Readonly<{
  id: string;
  layerId: PlastrongDomeLayerId;
  rigid: boolean;
  material: 'rigid-shell' | 'flexible-tissue' | 'soft-muscle' | 'effect';
  description: string;
}>;

export type Batch03PhysiqueGeometry = Readonly<{
  shellWidth: number;
  shellHeight: number;
  plastronSpacing: number;
  shoulderOpeningWidth: number;
  hipOpeningWidth: number;
  limbThickness: number;
  neckThickness: number;
  stanceWidth: number;
  centerOfGravity: number;
  exposedMuscle: number;
  posture: number;
}>;

export type Batch03AnatomyProfile = Readonly<{
  id: string;
  speciesId: Batch03SpeciesId;
  anatomyFamily: Batch03AnatomyFamily;
  speciesSpecificPresetLabel: 'Dome Fortress' | 'Rail Drive' | 'Cairn Carry';
  protectedSilhouetteFeatures: readonly string[];
  modules: readonly Batch03DomeModule[];
  presetGeometry: Readonly<Record<Batch03PhysiqueKind, Batch03PhysiqueGeometry>>;
  sideViewRule: string;
  pumpRule: string;
  fatigueRule: string;
}>;

const PLASTRONG_MODULES: readonly Batch03DomeModule[] =
  PLASTRONG_DOME_LAYER_IDS.map((layerId) => {
    const rigid = [
      'upper-dome',
      'front-plastron',
      'shell-seams',
      'equipment-mounts',
    ].includes(layerId);
    const material =
      layerId === 'pump-highlights' || layerId === 'rare-trait-effects'
        ? 'effect'
        : rigid
          ? 'rigid-shell'
          : layerId === 'exposed-limb-musculature'
            ? 'soft-muscle'
            : 'flexible-tissue';
    return {
      id: `batch03.plastrong.layer.${layerId}`,
      layerId,
      rigid,
      material,
      description: {
        'upper-dome':
          'Complete authored upper shell with a fixed domed volume.',
        'front-plastron':
          'Separate front plate with a readable central brace gap.',
        'shoulder-openings':
          'Flexible openings that expose the forelimb power chain.',
        'hip-openings':
          'Rear openings that preserve planted leg articulation.',
        'neck-opening':
          'Flexible collar opening separating neck tissue from shell.',
        'flexible-joint-tissue':
          'Visible non-rigid tissue at neck, shoulder, and hip joints.',
        'exposed-limb-musculature':
          'Powerful authored limbs outside the rigid dome.',
        'shell-seams':
          'Fixed shell segmentation and direction-reading seam paths.',
        'equipment-mounts':
          'Hard points for shell belts, harnesses, chains, and insignia.',
        'pump-highlights':
          'Temporary light on exposed tissue and seams, never shell growth.',
        'rare-trait-effects':
          'Optional glow or particles that preserve the dome outline.',
      }[layerId],
    } as const;
  });

function geometry(
  values: Partial<Batch03PhysiqueGeometry> = {},
): Batch03PhysiqueGeometry {
  return {
    shellWidth: 1,
    shellHeight: 1,
    plastronSpacing: 1,
    shoulderOpeningWidth: 1,
    hipOpeningWidth: 1,
    limbThickness: 1,
    neckThickness: 1,
    stanceWidth: 1,
    centerOfGravity: 1,
    exposedMuscle: 1,
    posture: 1,
    ...values,
  };
}

const PLASTRONG_GEOMETRY = {
  compact: geometry({
    shellWidth: 0.94,
    plastronSpacing: 0.92,
    shoulderOpeningWidth: 0.9,
    hipOpeningWidth: 0.92,
    limbThickness: 1.06,
    neckThickness: 1.04,
    stanceWidth: 0.9,
    centerOfGravity: 0.88,
    exposedMuscle: 1.02,
    posture: 0.96,
  }),
  balanced: geometry(),
  broad: geometry({
    shellWidth: 1.08,
    plastronSpacing: 1.08,
    shoulderOpeningWidth: 1.12,
    hipOpeningWidth: 1.08,
    limbThickness: 1.08,
    neckThickness: 1.06,
    stanceWidth: 1.12,
    centerOfGravity: 0.94,
    exposedMuscle: 1.06,
    posture: 1.02,
  }),
  specialized: geometry({
    shellWidth: 0.98,
    plastronSpacing: 1.12,
    shoulderOpeningWidth: 1.14,
    hipOpeningWidth: 1.12,
    limbThickness: 1.16,
    neckThickness: 1.1,
    stanceWidth: 1.04,
    centerOfGravity: 0.9,
    exposedMuscle: 1.16,
    posture: 1.08,
  }),
  'species-specific': geometry({
    shellWidth: 1.1,
    plastronSpacing: 1.1,
    shoulderOpeningWidth: 1.14,
    hipOpeningWidth: 1.14,
    limbThickness: 1.18,
    neckThickness: 1.16,
    stanceWidth: 1.16,
    centerOfGravity: 0.82,
    exposedMuscle: 1.12,
    posture: 1.04,
  }),
} as const satisfies Record<Batch03PhysiqueKind, Batch03PhysiqueGeometry>;

const RAILHORN_GEOMETRY = {
  compact: geometry({
    shellWidth: 0.92,
    shellHeight: 0.96,
    limbThickness: 1.06,
    stanceWidth: 0.9,
    centerOfGravity: 0.86,
  }),
  balanced: geometry(),
  broad: geometry({
    shellWidth: 1.08,
    limbThickness: 1.08,
    stanceWidth: 1.1,
    exposedMuscle: 1.04,
  }),
  specialized: geometry({
    shellWidth: 1.02,
    shoulderOpeningWidth: 1.12,
    limbThickness: 1.16,
    neckThickness: 1.12,
    exposedMuscle: 1.14,
    posture: 1.08,
  }),
  'species-specific': geometry({
    shellWidth: 1.06,
    shoulderOpeningWidth: 1.14,
    limbThickness: 1.14,
    neckThickness: 1.16,
    stanceWidth: 1.14,
    centerOfGravity: 0.84,
    exposedMuscle: 1.1,
    posture: 1.12,
  }),
} as const satisfies Record<Batch03PhysiqueKind, Batch03PhysiqueGeometry>;

const CAIRNOX_GEOMETRY = {
  compact: geometry({
    shellWidth: 0.94,
    shellHeight: 0.96,
    hipOpeningWidth: 0.92,
    limbThickness: 1.08,
    stanceWidth: 0.92,
    centerOfGravity: 0.88,
  }),
  balanced: geometry(),
  broad: geometry({
    shellWidth: 1.1,
    hipOpeningWidth: 1.1,
    limbThickness: 1.08,
    stanceWidth: 1.12,
    exposedMuscle: 1.04,
  }),
  specialized: geometry({
    shellWidth: 1.02,
    shoulderOpeningWidth: 1.12,
    hipOpeningWidth: 1.14,
    limbThickness: 1.14,
    stanceWidth: 1.08,
    exposedMuscle: 1.14,
    posture: 1.08,
  }),
  'species-specific': geometry({
    shellWidth: 1.08,
    shellHeight: 1.04,
    shoulderOpeningWidth: 1.12,
    hipOpeningWidth: 1.12,
    limbThickness: 1.16,
    neckThickness: 1.12,
    stanceWidth: 1.14,
    centerOfGravity: 0.86,
    exposedMuscle: 1.1,
  }),
} as const satisfies Record<Batch03PhysiqueKind, Batch03PhysiqueGeometry>;

function companionModules(
  prefix: string,
): readonly Batch03DomeModule[] {
  return [
    {
      id: `batch03.${prefix}.layer.upper-dome`,
      layerId: 'upper-dome',
      rigid: true,
      material: 'rigid-shell',
      description: 'Rigid torso mass authored independently from the limbs.',
    },
    {
      id: `batch03.${prefix}.layer.flexible-joint-tissue`,
      layerId: 'flexible-joint-tissue',
      rigid: false,
      material: 'flexible-tissue',
      description: 'Visible articulation between the rigid mass and limbs.',
    },
    {
      id: `batch03.${prefix}.layer.exposed-limb-musculature`,
      layerId: 'exposed-limb-musculature',
      rigid: false,
      material: 'soft-muscle',
      description: 'Exposed muscular limbs that carry physique and pump.',
    },
    {
      id: `batch03.${prefix}.layer.equipment-mounts`,
      layerId: 'equipment-mounts',
      rigid: true,
      material: 'rigid-shell',
      description: 'Species-shaped equipment anchor hard points.',
    },
  ];
}

export const BATCH_03_ANATOMY_PROFILES: readonly Batch03AnatomyProfile[] = [
  {
    id: 'batch03.anatomy.plastrong',
    speciesId: 'titan-tortoise',
    anatomyFamily: 'complete-domed-shell',
    speciesSpecificPresetLabel: 'Dome Fortress',
    protectedSilhouetteFeatures: [
      'complete-domed-upper-shell',
      'separate-front-plastron',
      'flexible-neck',
      'four-exposed-power-limbs',
      'low-controlled-center-of-gravity',
    ],
    modules: PLASTRONG_MODULES,
    presetGeometry: PLASTRONG_GEOMETRY,
    sideViewRule:
      'Left and right are individually authored with a visible dome arc, plastron edge, neck opening, and near/far limb separation.',
    pumpRule:
      'Pump changes exposed limbs, neck, joint tissue, stance, definition, and seam light; rigid dome dimensions remain fixed.',
    fatigueRule:
      'Fatigue lowers the head, bends exposed limbs, narrows the stance, dims seams, and slows breathing without cracks or injury.',
  },
  {
    id: 'batch03.anatomy.railhorn-v2',
    speciesId: 'ripped-rhino',
    anatomyFamily: 'low-profile-armored',
    speciesSpecificPresetLabel: 'Rail Drive',
    protectedSilhouetteFeatures: [
      'rail-horn',
      'low-wedge-carapace',
      'separated-shoulder-joints',
      'planted-forelimbs',
    ],
    modules: companionModules('railhorn-v2'),
    presetGeometry: RAILHORN_GEOMETRY,
    sideViewRule:
      'Both sides preserve horn direction, wedge depth, and separate near/far forelimbs without mirroring.',
    pumpRule:
      'Pump changes exposed joints and posture while the wedge plates remain fixed.',
    fatigueRule:
      'Fatigue lowers the horn line and stance without shell damage.',
  },
  {
    id: 'batch03.anatomy.cairnox',
    speciesId: 'boulder-bison',
    anatomyFamily: 'rigid-torso-exposed-limbs',
    speciesSpecificPresetLabel: 'Cairn Carry',
    protectedSilhouetteFeatures: [
      'stacked-rigid-hump',
      'loop-horns',
      'four-exposed-pillar-limbs',
      'separated-torso-openings',
    ],
    modules: companionModules('cairnox'),
    presetGeometry: CAIRNOX_GEOMETRY,
    sideViewRule:
      'Side views show stepped rigid torso depth, loop horn clearance, and four distinct limb contacts.',
    pumpRule:
      'Pump affects exposed pillar limbs, neck, and stance; stacked torso blocks never expand.',
    fatigueRule:
      'Fatigue lowers the neck and bends the limbs while the cairn torso remains undamaged.',
  },
] as const;

export const PLASTRONG_ACCESSORY_IDS = [
  'batch03.plastrong.shell-mounted-belt',
  'batch03.plastrong.forelimb-wraps',
  'batch03.plastrong.reinforced-knee-sleeves',
  'batch03.plastrong.training-harness',
  'batch03.plastrong.shell-chain',
  'batch03.plastrong.victory-medal',
  'batch03.plastrong.champion-ribbon',
  'batch03.plastrong.boss-insignia',
] as const;
export type PlastrongAccessoryId =
  (typeof PLASTRONG_ACCESSORY_IDS)[number];

export type Batch03AccessoryMount = Readonly<{
  id: string;
  accessoryId: PlastrongAccessoryId;
  direction: BuddyFacingDirection;
  anchor: Readonly<{ x: number; y: number }>;
  mountLayer: 'equipment-mounts' | 'exposed-limb-musculature';
}>;

const MOUNT_POINTS: Readonly<
  Record<
    PlastrongAccessoryId,
    Readonly<Record<BuddyFacingDirection, Readonly<{ x: number; y: number }>>>
  >
> = {
  'batch03.plastrong.shell-mounted-belt': {
    front: { x: 12, y: 15 },
    back: { x: 12, y: 15 },
    left: { x: 12, y: 15 },
    right: { x: 12, y: 15 },
  },
  'batch03.plastrong.forelimb-wraps': {
    front: { x: 5, y: 15 },
    back: { x: 19, y: 15 },
    left: { x: 7, y: 16 },
    right: { x: 17, y: 16 },
  },
  'batch03.plastrong.reinforced-knee-sleeves': {
    front: { x: 12, y: 19 },
    back: { x: 12, y: 19 },
    left: { x: 12, y: 19 },
    right: { x: 12, y: 19 },
  },
  'batch03.plastrong.training-harness': {
    front: { x: 12, y: 10 },
    back: { x: 12, y: 9 },
    left: { x: 12, y: 10 },
    right: { x: 12, y: 10 },
  },
  'batch03.plastrong.shell-chain': {
    front: { x: 12, y: 8 },
    back: { x: 12, y: 8 },
    left: { x: 12, y: 9 },
    right: { x: 12, y: 9 },
  },
  'batch03.plastrong.victory-medal': {
    front: { x: 12, y: 12 },
    back: { x: 12, y: 10 },
    left: { x: 13, y: 11 },
    right: { x: 11, y: 11 },
  },
  'batch03.plastrong.champion-ribbon': {
    front: { x: 17, y: 8 },
    back: { x: 7, y: 8 },
    left: { x: 15, y: 8 },
    right: { x: 9, y: 8 },
  },
  'batch03.plastrong.boss-insignia': {
    front: { x: 12, y: 9 },
    back: { x: 12, y: 8 },
    left: { x: 13, y: 9 },
    right: { x: 11, y: 9 },
  },
};

export const PLASTRONG_ACCESSORY_MOUNTS: readonly Batch03AccessoryMount[] =
  PLASTRONG_ACCESSORY_IDS.flatMap((accessoryId) =>
    (['front', 'back', 'left', 'right'] as const).map((direction) => ({
      id: `${accessoryId}.${direction}`,
      accessoryId,
      direction,
      anchor: MOUNT_POINTS[accessoryId][direction],
      mountLayer:
        accessoryId.includes('wraps') || accessoryId.includes('sleeves')
          ? 'exposed-limb-musculature'
          : 'equipment-mounts',
    })),
  );

export const PLASTRONG_REJECTED_GENERIC_ACCESSORIES = [
  'accessory-belt',
  'accessory-chain',
] as const;

export const BATCH_03_BOSS_TIER_RULES: Readonly<
  Record<
    BossPresentationTier,
    {
      id: string;
      shellScale: 1;
      seamLight: number;
      stance: number;
      posture: number;
      equipmentState: 'mounted' | 'braced' | 'locked' | 'ceremonial' | 'lowered';
      animationIntensity: number;
    }
  >
> = {
  normal: {
    id: 'batch03.dome-warden.tier.normal',
    shellScale: 1,
    seamLight: 0,
    stance: 0,
    posture: 0,
    equipmentState: 'mounted',
    animationIntensity: 0,
  },
  pumped: {
    id: 'batch03.dome-warden.tier.pumped',
    shellScale: 1,
    seamLight: 1,
    stance: 1,
    posture: 1,
    equipmentState: 'braced',
    animationIntensity: 1,
  },
  overload: {
    id: 'batch03.dome-warden.tier.overload',
    shellScale: 1,
    seamLight: 3,
    stance: 2,
    posture: 2,
    equipmentState: 'locked',
    animationIntensity: 3,
  },
  'final-round': {
    id: 'batch03.dome-warden.tier.final-round',
    shellScale: 1,
    seamLight: 4,
    stance: 3,
    posture: 3,
    equipmentState: 'ceremonial',
    animationIntensity: 4,
  },
  defeated: {
    id: 'batch03.dome-warden.tier.defeated',
    shellScale: 1,
    seamLight: 0,
    stance: -1,
    posture: -2,
    equipmentState: 'lowered',
    animationIntensity: 0,
  },
};

function physiqueKind(presetId: string): Batch03PhysiqueKind {
  if (presetId.endsWith('-compact')) return 'compact';
  if (presetId.endsWith('-balanced')) return 'balanced';
  if (presetId.endsWith('-broad')) return 'broad';
  if (presetId.endsWith('-specialized')) return 'specialized';
  return 'species-specific';
}

export type Batch03PresentationPlan = Readonly<{
  speciesId: Batch03SpeciesId;
  physiqueKind: Batch03PhysiqueKind;
  geometry: Batch03PhysiqueGeometry;
  rigidShellScale: 1;
  pumpRigidShellDelta: 0;
  pumpIntensity: 0 | 1 | 2;
  bossTierId?: string;
}>;

export function getBatch03AnatomyProfile(speciesId: string) {
  return BATCH_03_ANATOMY_PROFILES.find(
    (profile) => profile.speciesId === speciesId,
  );
}

export function createBatch03PresentationPlan(
  speciesId: string,
  value?: Partial<BuddyCosmetics> | null,
  bossTier?: BossPresentationTier,
): Batch03PresentationPlan | undefined {
  const profile = getBatch03AnatomyProfile(speciesId);
  if (!profile) return undefined;
  const cosmetics = normalizeBuddyCosmetics(speciesId, value);
  const kind = physiqueKind(cosmetics.physiquePresetId);
  return {
    speciesId: profile.speciesId,
    physiqueKind: kind,
    geometry: profile.presetGeometry[kind],
    rigidShellScale: 1,
    pumpRigidShellDelta: 0,
    pumpIntensity:
      cosmetics.physique.pumpEffectId === 'full'
        ? 2
        : cosmetics.physique.pumpEffectId === 'warm'
          ? 1
          : 0,
    bossTierId: bossTier
      ? BATCH_03_BOSS_TIER_RULES[bossTier].id
      : undefined,
  };
}

export function getPlastrongAccessoryMount(
  accessoryId: string,
  direction: BuddyFacingDirection,
) {
  return PLASTRONG_ACCESSORY_MOUNTS.find(
    (mount) =>
      mount.accessoryId === accessoryId && mount.direction === direction,
  );
}

export function isPlastrongAccessoryAccepted(accessoryId: string) {
  return PLASTRONG_ACCESSORY_IDS.includes(
    accessoryId as PlastrongAccessoryId,
  );
}

export function validateBatch03DomeShellData(): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const plastrong = getBatch03AnatomyProfile('titan-tortoise');
  if (!plastrong) return ['Missing Plastrong Batch 03 anatomy profile.'];
  const layers = new Set(plastrong.modules.map((module) => module.layerId));
  for (const layerId of PLASTRONG_DOME_LAYER_IDS) {
    if (!layers.has(layerId)) {
      errors.push(`Plastrong is missing authored layer "${layerId}".`);
    }
  }
  for (const profile of BATCH_03_ANATOMY_PROFILES) {
    if (ids.has(profile.id)) errors.push(`Duplicate profile ID "${profile.id}".`);
    ids.add(profile.id);
    for (const module of profile.modules) {
      if (ids.has(module.id)) errors.push(`Duplicate module ID "${module.id}".`);
      ids.add(module.id);
      if (
        module.material === 'rigid-shell' &&
        !module.rigid
      ) {
        errors.push(`Rigid module "${module.id}" is marked flexible.`);
      }
      if (
        (module.material === 'flexible-tissue' ||
          module.material === 'soft-muscle') &&
        module.rigid
      ) {
        errors.push(`Flexible module "${module.id}" is marked rigid.`);
      }
    }
    for (const preset of Object.values(profile.presetGeometry)) {
      if (preset.shellWidth < 0.9 || preset.shellWidth > 1.1) {
        errors.push(`Profile "${profile.id}" exceeds safe shell width.`);
      }
      if (preset.shellHeight < 0.94 || preset.shellHeight > 1.06) {
        errors.push(`Profile "${profile.id}" exceeds safe shell height.`);
      }
    }
  }
  for (const mount of PLASTRONG_ACCESSORY_MOUNTS) {
    if (ids.has(mount.id)) errors.push(`Duplicate mount ID "${mount.id}".`);
    ids.add(mount.id);
    if (
      mount.anchor.x < 1 ||
      mount.anchor.x > 22 ||
      mount.anchor.y < 1 ||
      mount.anchor.y > 21
    ) {
      errors.push(`Accessory mount "${mount.id}" is out of 24x24 bounds.`);
    }
  }
  for (const genericId of PLASTRONG_REJECTED_GENERIC_ACCESSORIES) {
    if (isPlastrongAccessoryAccepted(genericId)) {
      errors.push(`Generic accessory "${genericId}" was accepted.`);
    }
  }
  for (const [tier, rule] of Object.entries(BATCH_03_BOSS_TIER_RULES)) {
    if (rule.shellScale !== 1) {
      errors.push(`Boss tier "${tier}" scales the rigid dome.`);
    }
  }
  return errors;
}
