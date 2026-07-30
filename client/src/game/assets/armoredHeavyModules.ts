import type { BossPresentationTier } from '../types';

export type Batch02AnatomyFamily =
  | 'armored-shelled'
  | 'compact-powerhouse'
  | 'heavy-biped';

export type Batch02PhysiqueKind =
  | 'compact'
  | 'balanced'
  | 'broad'
  | 'specialized'
  | 'species-specific';

export type Batch02ModuleKind =
  | 'hard-shell'
  | 'flexible-joint'
  | 'under-shell-muscle'
  | 'armor-plate'
  | 'limb-guard'
  | 'equipment'
  | 'soft-anatomy';

export type Batch02VisualModule = Readonly<{
  id: string;
  kind: Batch02ModuleKind;
  region:
    | 'back'
    | 'chest'
    | 'shoulders'
    | 'forelimbs'
    | 'knees'
    | 'waist'
    | 'hands'
    | 'torso';
  rigid: boolean;
  description: string;
}>;

export type Batch02PhysiqueGeometry = Readonly<{
  shellWidth: number;
  limbThickness: number;
  stanceWidth: number;
  plateSpacing: number;
  exposedMuscle: number;
  centerOfGravity: number;
  neckPosture: number;
}>;

export type Batch02AnatomyProfile = Readonly<{
  id: string;
  speciesId: 'ripped-rhino' | 'spotmole' | 'titan-gorilla';
  anatomyFamilyId: Batch02AnatomyFamily;
  protectedSilhouetteFeatures: readonly string[];
  modules: readonly Batch02VisualModule[];
  presetGeometry: Readonly<Record<Batch02PhysiqueKind, Batch02PhysiqueGeometry>>;
  pumpRule: string;
  fatigueRule: string;
}>;

const RAILHORN_GEOMETRY = {
  compact: {
    shellWidth: 0.92,
    limbThickness: 1.08,
    stanceWidth: 0.9,
    plateSpacing: 0.86,
    exposedMuscle: 0.92,
    centerOfGravity: 0.85,
    neckPosture: 0.92,
  },
  balanced: {
    shellWidth: 1,
    limbThickness: 1,
    stanceWidth: 1,
    plateSpacing: 1,
    exposedMuscle: 1,
    centerOfGravity: 1,
    neckPosture: 1,
  },
  broad: {
    shellWidth: 1.12,
    limbThickness: 1.05,
    stanceWidth: 1.12,
    plateSpacing: 1.08,
    exposedMuscle: 1,
    centerOfGravity: 0.94,
    neckPosture: 1.05,
  },
  specialized: {
    shellWidth: 1.04,
    limbThickness: 1.14,
    stanceWidth: 1.06,
    plateSpacing: 1.12,
    exposedMuscle: 1.14,
    centerOfGravity: 0.92,
    neckPosture: 1.12,
  },
  'species-specific': {
    shellWidth: 1.08,
    limbThickness: 1.1,
    stanceWidth: 1.14,
    plateSpacing: 1.16,
    exposedMuscle: 1.06,
    centerOfGravity: 0.82,
    neckPosture: 1.18,
  },
} as const satisfies Record<Batch02PhysiqueKind, Batch02PhysiqueGeometry>;

const SOFT_GEOMETRY = {
  compact: {
    shellWidth: 0.9,
    limbThickness: 1.06,
    stanceWidth: 0.9,
    plateSpacing: 1,
    exposedMuscle: 1.03,
    centerOfGravity: 0.86,
    neckPosture: 0.96,
  },
  balanced: {
    shellWidth: 1,
    limbThickness: 1,
    stanceWidth: 1,
    plateSpacing: 1,
    exposedMuscle: 1,
    centerOfGravity: 1,
    neckPosture: 1,
  },
  broad: {
    shellWidth: 1.08,
    limbThickness: 1.08,
    stanceWidth: 1.12,
    plateSpacing: 1,
    exposedMuscle: 1.05,
    centerOfGravity: 0.95,
    neckPosture: 1.04,
  },
  specialized: {
    shellWidth: 0.98,
    limbThickness: 1.16,
    stanceWidth: 1.04,
    plateSpacing: 1,
    exposedMuscle: 1.12,
    centerOfGravity: 0.92,
    neckPosture: 1.08,
  },
  'species-specific': {
    shellWidth: 1.02,
    limbThickness: 1.14,
    stanceWidth: 1.1,
    plateSpacing: 1,
    exposedMuscle: 1.1,
    centerOfGravity: 0.84,
    neckPosture: 1.12,
  },
} as const satisfies Record<Batch02PhysiqueKind, Batch02PhysiqueGeometry>;

export const BATCH_02_ANATOMY_PROFILES: readonly Batch02AnatomyProfile[] = [
  {
    id: 'batch02.anatomy.railhorn',
    speciesId: 'ripped-rhino',
    anatomyFamilyId: 'armored-shelled',
    protectedSilhouetteFeatures: [
      'rail-horn',
      'sloped-dorsal-carapace',
      'planted-forelimbs',
      'low-center-of-gravity',
    ],
    modules: [
      {
        id: 'batch02.railhorn.hard-dorsal-carapace',
        kind: 'hard-shell',
        region: 'back',
        rigid: true,
        description: 'Sloped load-bearing back shell with fixed plate volume.',
      },
      {
        id: 'batch02.railhorn.segmented-shoulder-plates',
        kind: 'armor-plate',
        region: 'shoulders',
        rigid: true,
        description: 'Separated plates that shift at joints instead of stretching.',
      },
      {
        id: 'batch02.railhorn.chest-keel',
        kind: 'armor-plate',
        region: 'chest',
        rigid: true,
        description: 'Hard chest plate with visible central seam.',
      },
      {
        id: 'batch02.railhorn.flex-joints',
        kind: 'flexible-joint',
        region: 'forelimbs',
        rigid: false,
        description: 'Exposed flexible joints that carry pump highlights.',
      },
      {
        id: 'batch02.railhorn.undershell-power',
        kind: 'under-shell-muscle',
        region: 'torso',
        rigid: false,
        description: 'Under-shell musculature visible through stance and seams.',
      },
      {
        id: 'batch02.railhorn.forelimb-wraps',
        kind: 'equipment',
        region: 'forelimbs',
        rigid: false,
        description: 'Species-shaped wraps clear of plate hinges.',
      },
      {
        id: 'batch02.railhorn.shell-harness',
        kind: 'equipment',
        region: 'waist',
        rigid: true,
        description: 'Shell-mounted lifting harness with a floating joint gap.',
      },
    ],
    presetGeometry: RAILHORN_GEOMETRY,
    pumpRule:
      'Pump changes exposed joints, seam light, stance confidence, and animation intensity; it never expands rigid plates.',
    fatigueRule:
      'Fatigue lowers the head and shoulders, closes the stance, dims seams, and slows impact timing without cracks or damage.',
  },
  {
    id: 'batch02.anatomy.spotmole',
    speciesId: 'spotmole',
    anatomyFamilyId: 'compact-powerhouse',
    protectedSilhouetteFeatures: [
      'shovel-hands',
      'low-wide-ruff',
      'short-powerful-limbs',
      'compact-torso',
    ],
    modules: [
      {
        id: 'batch02.spotmole.compact-core',
        kind: 'soft-anatomy',
        region: 'torso',
        rigid: false,
        description: 'Dense torso mass that stays below the broad shoulder ruff.',
      },
      {
        id: 'batch02.spotmole.shovel-wraps',
        kind: 'equipment',
        region: 'hands',
        rigid: false,
        description: 'Wide wraps authored around shovel hands.',
      },
      {
        id: 'batch02.spotmole.reinforced-knees',
        kind: 'limb-guard',
        region: 'knees',
        rigid: true,
        description: 'Short knee sleeves aligned to the low stance.',
      },
      {
        id: 'batch02.spotmole.victory-medal',
        kind: 'equipment',
        region: 'chest',
        rigid: true,
        description: 'Compact medal clear of the digging ruff.',
      },
    ],
    presetGeometry: SOFT_GEOMETRY,
    pumpRule:
      'Pump increases visible forelimb definition, ruff lift, and stance confidence while preserving the shovel-hand outline.',
    fatigueRule:
      'Fatigue lowers the ruff and hands and narrows the stance without presenting injury.',
  },
  {
    id: 'batch02.anatomy.knuckledge',
    speciesId: 'titan-gorilla',
    anatomyFamilyId: 'heavy-biped',
    protectedSilhouetteFeatures: [
      'long-bridge-arms',
      'slab-knuckles',
      'high-back-arch',
      'heavy-biped-stance',
    ],
    modules: [
      {
        id: 'batch02.knuckledge.bridge-back',
        kind: 'soft-anatomy',
        region: 'back',
        rigid: false,
        description: 'High thick back bridging into long load-bearing arms.',
      },
      {
        id: 'batch02.knuckledge.knuckle-wraps',
        kind: 'equipment',
        region: 'hands',
        rigid: false,
        description: 'Flat wraps following the slab-knuckle silhouette.',
      },
      {
        id: 'batch02.knuckledge.gym-chain',
        kind: 'equipment',
        region: 'shoulders',
        rigid: true,
        description: 'Large chain seated across the shoulder bridge.',
      },
      {
        id: 'batch02.knuckledge.training-belt',
        kind: 'equipment',
        region: 'waist',
        rigid: true,
        description: 'Short belt aligned to a narrow waist and long torso.',
      },
    ],
    presetGeometry: SOFT_GEOMETRY,
    pumpRule:
      'Pump increases forearm and back definition and raises the bridge posture without lengthening the arms.',
    fatigueRule:
      'Fatigue shifts weight toward the knuckles and lowers the bridge while keeping the biped silhouette readable.',
  },
] as const;

export const BATCH_02_BOSS_TIER_RULES: Readonly<
  Record<
    BossPresentationTier,
    {
      id: string;
      plateGlow: number;
      stanceOpen: number;
      seamEnergy: number;
      impactIntensity: number;
      equipmentState: 'base' | 'raised' | 'locked' | 'released';
      armorScale: 1;
    }
  >
> = {
  normal: {
    id: 'batch02.a-rhino.tier.normal',
    plateGlow: 0,
    stanceOpen: 0,
    seamEnergy: 0,
    impactIntensity: 0,
    equipmentState: 'base',
    armorScale: 1,
  },
  pumped: {
    id: 'batch02.a-rhino.tier.pumped',
    plateGlow: 1,
    stanceOpen: 1,
    seamEnergy: 1,
    impactIntensity: 1,
    equipmentState: 'raised',
    armorScale: 1,
  },
  overload: {
    id: 'batch02.a-rhino.tier.overload',
    plateGlow: 2,
    stanceOpen: 2,
    seamEnergy: 3,
    impactIntensity: 3,
    equipmentState: 'locked',
    armorScale: 1,
  },
  'final-round': {
    id: 'batch02.a-rhino.tier.final-round',
    plateGlow: 3,
    stanceOpen: 3,
    seamEnergy: 3,
    impactIntensity: 4,
    equipmentState: 'locked',
    armorScale: 1,
  },
  defeated: {
    id: 'batch02.a-rhino.tier.defeated',
    plateGlow: 0,
    stanceOpen: -1,
    seamEnergy: 0,
    impactIntensity: 0,
    equipmentState: 'released',
    armorScale: 1,
  },
};

export function getBatch02AnatomyProfile(speciesId: string) {
  return BATCH_02_ANATOMY_PROFILES.find(
    (profile) => profile.speciesId === speciesId,
  );
}

export function validateBatch02AnatomyProfiles(): readonly string[] {
  const errors: string[] = [];
  const stableIds = new Set<string>();
  const speciesIds = new Set<string>();
  for (const profile of BATCH_02_ANATOMY_PROFILES) {
    if (stableIds.has(profile.id)) errors.push(`Duplicate profile ID "${profile.id}".`);
    stableIds.add(profile.id);
    if (speciesIds.has(profile.speciesId)) {
      errors.push(`Duplicate Batch 02 species "${profile.speciesId}".`);
    }
    speciesIds.add(profile.speciesId);
    for (const module of profile.modules) {
      if (stableIds.has(module.id)) errors.push(`Duplicate module ID "${module.id}".`);
      stableIds.add(module.id);
      if (module.kind === 'hard-shell' && !module.rigid) {
        errors.push(`Hard shell module "${module.id}" must be rigid.`);
      }
      if (
        (module.kind === 'flexible-joint' ||
          module.kind === 'under-shell-muscle') &&
        module.rigid
      ) {
        errors.push(`Flexible module "${module.id}" cannot be rigid.`);
      }
    }
    for (const geometry of Object.values(profile.presetGeometry)) {
      if (geometry.shellWidth < 0.85 || geometry.shellWidth > 1.15) {
        errors.push(`Profile "${profile.id}" exceeds safe shell-width bounds.`);
      }
    }
  }
  for (const [tier, rule] of Object.entries(BATCH_02_BOSS_TIER_RULES)) {
    if (rule.armorScale !== 1) {
      errors.push(`Boss tier "${tier}" inflates rigid armor.`);
    }
  }
  return errors;
}
