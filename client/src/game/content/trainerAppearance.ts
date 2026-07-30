import type {
  TrainerAppearance,
  TrainerAppearanceOption,
  TrainerBuildAttribute,
  TrainerBuildAttributeId,
  TrainerBuildRegion,
  TrainerColorOption,
  TrainerCosmeticBuild,
  TrainerPhysiquePreset,
  TrainerRandomizationFilter,
} from '../types/trainer';

export const TRAINER_BUILD_MIN = 0;
export const TRAINER_BUILD_MAX = 10;
export const TRAINER_APPEARANCE_VERSION = 3 as const;
export const MAX_SAVED_APPEARANCE_PRESETS = 12;

function attribute(
  id: TrainerBuildAttributeId,
  label: string,
  detail: string,
  minimumLabel: string,
  maximumLabel: string,
  region: TrainerBuildRegion,
  quick = false,
): TrainerBuildAttribute {
  return {
    id,
    key: id,
    label,
    detail,
    minimumLabel,
    maximumLabel,
    region,
    quick,
  };
}

export const TRAINER_BUILD_ATTRIBUTES: TrainerBuildAttribute[] = [
  attribute('height', 'Height', 'Changes the cosmetic vertical silhouette only.', 'Compact', 'Towering', 'build'),
  attribute('bodyScale', 'Overall Scale', 'Changes the overall frame while preserving a powerful silhouette.', 'Trim frame', 'Broad frame', 'build', true),
  attribute('headSize', 'Head Size', 'Adjusts head proportions without changing gameplay.', 'Small', 'Large', 'build'),
  attribute('neckThickness', 'Neck', 'Sets the visual neck thickness beneath the head.', 'Defined', 'Thick', 'upper-body'),
  attribute('shoulderWidth', 'Shoulders', 'Shapes the upper-body width in every facing direction.', 'Athletic', 'Extra wide', 'upper-body', true),
  attribute('trapeziusSize', 'Trapezius', 'Raises and thickens the upper-back silhouette.', 'Defined', 'High-set', 'upper-body'),
  attribute('chestSize', 'Chest', 'Changes torso depth and front-facing chest shape.', 'Athletic', 'Full', 'upper-body', true),
  attribute('upperBackWidth', 'Upper Back', 'Changes the back-facing taper and lat width.', 'Tapered', 'Wide', 'upper-body', true),
  attribute('lowerBackThickness', 'Lower Back', 'Changes the visual thickness above the waist.', 'Lean', 'Solid', 'core'),
  attribute('bicepsSize', 'Biceps', 'Changes the upper-arm curve in front and side views.', 'Defined', 'Massive', 'upper-body', true),
  attribute('tricepsSize', 'Triceps', 'Changes the rear upper-arm shape.', 'Defined', 'Massive', 'upper-body'),
  attribute('forearmSize', 'Forearms', 'Changes the lower-arm width and grip silhouette.', 'Lean', 'Thick', 'upper-body'),
  attribute('handSize', 'Hands', 'Changes hand and glove proportions.', 'Compact', 'Large', 'build'),
  attribute('coreDefinition', 'Core Definition', 'Adds cosmetic torso definition marks only.', 'Smooth', 'Etched', 'core', true),
  attribute('waistWidth', 'Waist', 'Changes midsection width while keeping clothing aligned.', 'Narrow', 'Wide', 'core', true),
  attribute('gluteSize', 'Glutes', 'Changes the rear and side hip silhouette.', 'Athletic', 'Powerful', 'lower-body'),
  attribute('quadSize', 'Quads', 'Changes front thigh width and stance.', 'Defined', 'Powerful', 'lower-body', true),
  attribute('hamstringSize', 'Hamstrings', 'Changes rear and side thigh depth.', 'Defined', 'Powerful', 'lower-body'),
  attribute('calfSize', 'Calves', 'Changes lower-leg width above shoes.', 'Defined', 'Full', 'lower-body'),
  attribute('footSize', 'Feet', 'Changes shoe length and stance width.', 'Compact', 'Large', 'build'),
  attribute('muscleDefinition', 'Muscle Definition', 'Controls fictional cosmetic highlight and shadow marks.', 'Soft shading', 'Sharp shading', 'build', true),
  attribute('bodyMass', 'Body Mass', 'Adds overall visual mass without changing trainer power.', 'Lean muscular', 'Heavyweight', 'build', true),
  attribute('clavicleWidth', 'Clavicle Width', 'Sets the shoulder-frame span beneath the delts.', 'Compact frame', 'Wide frame', 'upper-body'),
  attribute('shoulderRoundness', 'Shoulder Roundness', 'Changes the curve of the shoulder caps.', 'Angular', 'Rounded', 'upper-body'),
  attribute('frontDeltSize', 'Front-Delt Size', 'Changes the front-facing shoulder cap.', 'Defined', 'Full', 'upper-body'),
  attribute('sideDeltSize', 'Side-Delt Size', 'Changes outer shoulder width and roundness.', 'Defined', 'Capped', 'upper-body', true),
  attribute('rearDeltSize', 'Rear-Delt Size', 'Changes the back-facing shoulder cap.', 'Defined', 'Full', 'upper-body'),
  attribute('upperChestFullness', 'Upper-Chest Fullness', 'Changes upper torso fullness below the clavicles.', 'Athletic', 'Shelf-like', 'upper-body', true),
  attribute('lowerChestFullness', 'Lower-Chest Fullness', 'Changes lower chest depth and contour.', 'Athletic', 'Full', 'upper-body'),
  attribute('latWidth', 'Lat Width', 'Changes the broad back silhouette.', 'Tapered', 'Wide', 'upper-body', true),
  attribute('latFlare', 'Lat Flare', 'Changes how strongly the back tapers toward the waist.', 'Relaxed', 'Flared', 'upper-body'),
  attribute('midBackThickness', 'Mid-Back Thickness', 'Changes central back depth in back and side views.', 'Lean', 'Dense', 'upper-body'),
  attribute('trapeziusHeight', 'Trapezius Height', 'Raises the trap silhouette toward the neck.', 'Low-set', 'High-set', 'upper-body'),
  attribute('trapeziusWidth', 'Trapezius Width', 'Widens the trap shelf across the upper back.', 'Compact', 'Wide', 'upper-body'),
  attribute('bicepsPeak', 'Biceps Peak', 'Changes the height of the flexed biceps silhouette.', 'Long curve', 'High peak', 'upper-body'),
  attribute('bicepsThickness', 'Biceps Thickness', 'Changes upper-arm depth without affecting gameplay power.', 'Defined', 'Dense', 'upper-body'),
  attribute('tricepsHorseshoeDefinition', 'Triceps Horseshoe', 'Adds a fictional rear-arm separation mark.', 'Smooth', 'Etched', 'upper-body'),
  attribute('forearmThickness', 'Forearm Thickness', 'Changes the lower-arm silhouette around wraps and gloves.', 'Lean', 'Thick', 'upper-body'),
  attribute('forearmVascularDefinition', 'Forearm Vascular Detail', 'Adds stylized, fictional forearm detail marks.', 'Clean', 'Detailed', 'upper-body'),
  attribute('ribcageWidth', 'Ribcage Width', 'Changes upper-midsection width beneath the chest.', 'Compact', 'Broad', 'core'),
  attribute('waistTaper', 'Waist Taper', 'Changes the visual transition from ribs to waist.', 'Straight', 'Dramatic', 'core', true),
  attribute('abdominalDefinition', 'Abdominal Definition', 'Changes stylized abdominal panel lines.', 'Smooth', 'Etched', 'core'),
  attribute('obliqueDefinition', 'Oblique Definition', 'Adds side-core definition marks.', 'Smooth', 'Etched', 'core'),
  attribute('serratusDefinition', 'Serratus Definition', 'Adds stylized upper-side core notches.', 'Smooth', 'Detailed', 'core'),
  attribute('midsectionThickness', 'Midsection Thickness', 'Changes the side and front depth of the torso.', 'Compact', 'Thick', 'core'),
  attribute('hipWidth', 'Hip Width', 'Changes the pelvis and upper-leg anchor span.', 'Compact', 'Wide', 'lower-body'),
  attribute('gluteFullness', 'Glute Fullness', 'Changes rear and side glute projection.', 'Athletic', 'Full', 'lower-body'),
  attribute('quadSweep', 'Quad Sweep', 'Changes outer-thigh curvature in front poses.', 'Straight', 'Sweeping', 'lower-body', true),
  attribute('innerThighThickness', 'Inner-Thigh Thickness', 'Changes space and mass between the thighs.', 'Separated', 'Dense', 'lower-body'),
  attribute('hamstringDrop', 'Hamstring Drop', 'Changes rear-thigh length and lower contour.', 'High', 'Low', 'lower-body'),
  attribute('calfWidth', 'Calf Width', 'Changes lower-leg width independently.', 'Defined', 'Wide', 'lower-body'),
  attribute('calfHeight', 'Calf Height', 'Changes where the calf muscle sits on the lower leg.', 'Low', 'High', 'lower-body'),
  attribute('ankleThickness', 'Ankle Thickness', 'Changes the transition between calves and shoes.', 'Narrow', 'Thick', 'lower-body'),
  attribute('bodyFatPresentation', 'Body-Fat Presentation', 'Controls fictional visual softness only; it is not a health assessment.', 'Crisp', 'Soft', 'build'),
  attribute('muscleFullness', 'Muscle Fullness', 'Changes stylized muscle roundness without changing statistics.', 'Firm', 'Full', 'build', true),
  attribute('muscleSeparation', 'Muscle Separation', 'Changes contrast between fictional muscle groups.', 'Subtle', 'Deep', 'build', true),
  attribute('vascularity', 'Vascularity', 'Adds restrained fictional stage-detail pixels.', 'None', 'Pronounced', 'build'),
  attribute('pumpLevel', 'Pump Level', 'Changes temporary-looking cosmetic fullness only.', 'Rested', 'Stage pump', 'build', true),
  attribute('posture', 'Posture', 'Changes torso lift and shoulder carriage.', 'Relaxed', 'Stage tall', 'build', true),
  attribute('stanceWidth', 'Stance Width', 'Changes cosmetic foot and leg spacing.', 'Narrow', 'Wide', 'build', true),
  attribute('symmetryPreference', 'Symmetry Preference', 'Balances or intentionally offsets the left and right silhouette.', 'Expressive', 'Mirrored', 'build'),
];

const BALANCED_BUILD: TrainerCosmeticBuild = {
  height: 5,
  bodyScale: 5,
  headSize: 5,
  neckThickness: 6,
  shoulderWidth: 7,
  trapeziusSize: 6,
  chestSize: 7,
  upperBackWidth: 7,
  lowerBackThickness: 6,
  bicepsSize: 7,
  tricepsSize: 7,
  forearmSize: 6,
  handSize: 5,
  coreDefinition: 6,
  waistWidth: 5,
  gluteSize: 6,
  quadSize: 7,
  hamstringSize: 7,
  calfSize: 6,
  footSize: 5,
  muscleDefinition: 6,
  bodyMass: 7,
  clavicleWidth: 7,
  shoulderRoundness: 7,
  frontDeltSize: 7,
  sideDeltSize: 7,
  rearDeltSize: 7,
  upperChestFullness: 7,
  lowerChestFullness: 7,
  latWidth: 7,
  latFlare: 6,
  midBackThickness: 6,
  trapeziusHeight: 6,
  trapeziusWidth: 6,
  bicepsPeak: 6,
  bicepsThickness: 7,
  tricepsHorseshoeDefinition: 6,
  forearmThickness: 6,
  forearmVascularDefinition: 4,
  ribcageWidth: 6,
  waistTaper: 6,
  abdominalDefinition: 6,
  obliqueDefinition: 5,
  serratusDefinition: 5,
  midsectionThickness: 6,
  hipWidth: 5,
  gluteFullness: 6,
  quadSweep: 7,
  innerThighThickness: 6,
  hamstringDrop: 6,
  calfWidth: 6,
  calfHeight: 5,
  ankleThickness: 5,
  bodyFatPresentation: 4,
  muscleFullness: 7,
  muscleSeparation: 6,
  vascularity: 3,
  pumpLevel: 5,
  posture: 6,
  stanceWidth: 5,
  symmetryPreference: 8,
};

function buildWith(
  overrides: Partial<TrainerCosmeticBuild>,
): TrainerCosmeticBuild {
  return { ...BALANCED_BUILD, ...overrides };
}

export const TRAINER_PHYSIQUE_PRESETS: TrainerPhysiquePreset[] = [
  {
    id: 'balanced-athlete',
    label: 'Balanced Athlete',
    description: 'A broad-shouldered, evenly developed all-round silhouette.',
    build: buildWith({}),
  },
  {
    id: 'classic-bodybuilder',
    label: 'Classic Bodybuilder',
    description: 'Wide shoulders, a tight waist, and pronounced upper-body definition.',
    build: buildWith({ shoulderWidth: 9, chestSize: 9, upperBackWidth: 9, waistWidth: 3, bicepsSize: 9, tricepsSize: 9, coreDefinition: 9, muscleDefinition: 9 }),
  },
  {
    id: 'open-bodybuilder',
    label: 'Open-Mass Builder',
    description: 'Maximum roundness through the delts, chest, back, arms, and legs with a deliberate stage stance.',
    build: buildWith({ bodyScale: 9, neckThickness: 8, shoulderWidth: 10, trapeziusSize: 9, chestSize: 10, upperBackWidth: 10, lowerBackThickness: 8, bicepsSize: 10, tricepsSize: 10, forearmSize: 8, waistWidth: 6, gluteSize: 9, quadSize: 10, hamstringSize: 10, calfSize: 9, muscleDefinition: 9, bodyMass: 10 }),
  },
  {
    id: 'taper-performer',
    label: 'Taper Performer',
    description: 'Capped shoulders and a broad back frame a narrow waist with long, confident posing lines.',
    build: buildWith({ height: 7, bodyScale: 5, neckThickness: 5, shoulderWidth: 10, trapeziusSize: 6, chestSize: 8, upperBackWidth: 10, lowerBackThickness: 5, bicepsSize: 7, tricepsSize: 7, forearmSize: 5, waistWidth: 2, gluteSize: 6, quadSize: 6, hamstringSize: 6, calfSize: 6, coreDefinition: 8, muscleDefinition: 8, bodyMass: 5 }),
  },
  {
    id: 'sculpted-physique',
    label: 'Sculpted Physique',
    description: 'Dense shoulders, arms, back, and legs balanced around a controlled waist and crisp definition.',
    build: buildWith({ bodyScale: 7, neckThickness: 6, shoulderWidth: 9, trapeziusSize: 7, chestSize: 8, upperBackWidth: 9, lowerBackThickness: 7, bicepsSize: 9, tricepsSize: 9, forearmSize: 7, waistWidth: 4, gluteSize: 8, quadSize: 9, hamstringSize: 9, calfSize: 8, coreDefinition: 9, muscleDefinition: 10, bodyMass: 7 }),
  },
  {
    id: 'figure-balance',
    label: 'Figure Balance',
    description: 'Round delts, a clear back taper, and developed legs create a poised symmetrical silhouette.',
    build: buildWith({ height: 6, bodyScale: 6, neckThickness: 5, shoulderWidth: 9, trapeziusSize: 6, chestSize: 7, upperBackWidth: 9, lowerBackThickness: 5, bicepsSize: 6, tricepsSize: 7, forearmSize: 5, waistWidth: 3, gluteSize: 8, quadSize: 9, hamstringSize: 8, calfSize: 8, coreDefinition: 8, muscleDefinition: 9, bodyMass: 6 }),
  },
  {
    id: 'heavy-powerlifter',
    label: 'Heavy Powerlifter',
    description: 'A dense, grounded frame with a thick torso and powerful legs.',
    build: buildWith({ bodyScale: 8, neckThickness: 8, lowerBackThickness: 9, waistWidth: 8, gluteSize: 9, quadSize: 9, hamstringSize: 9, bodyMass: 10 }),
  },
  {
    id: 'strongman',
    label: 'Strongman',
    description: 'A towering heavyweight build with a high-set back and large hands.',
    build: buildWith({ height: 9, bodyScale: 9, neckThickness: 9, trapeziusSize: 10, chestSize: 9, upperBackWidth: 10, handSize: 9, bodyMass: 10 }),
  },
  {
    id: 'platform-lifter',
    label: 'Platform Lifter',
    description: 'Explosive traps, back, hips, and legs support a fast upright lifting posture.',
    build: buildWith({ height: 5, bodyScale: 6, neckThickness: 8, shoulderWidth: 7, trapeziusSize: 10, chestSize: 7, upperBackWidth: 9, lowerBackThickness: 8, bicepsSize: 6, tricepsSize: 7, forearmSize: 8, waistWidth: 5, gluteSize: 10, quadSize: 10, hamstringSize: 9, calfSize: 8, coreDefinition: 7, muscleDefinition: 8, bodyMass: 7 }),
  },
  {
    id: 'lean-fighter',
    label: 'Lean Fighter',
    description: 'Long, mobile proportions with crisp definition and compact mass.',
    build: buildWith({ height: 7, bodyScale: 3, shoulderWidth: 6, waistWidth: 3, quadSize: 6, calfSize: 7, coreDefinition: 10, muscleDefinition: 10, bodyMass: 3 }),
  },
  {
    id: 'lean-athlete',
    label: 'Lean Athletic',
    description: 'Long limbs, visible muscle separation, and balanced development support an efficient athletic stance.',
    build: buildWith({ height: 8, bodyScale: 4, neckThickness: 5, shoulderWidth: 7, trapeziusSize: 5, chestSize: 6, upperBackWidth: 7, lowerBackThickness: 5, bicepsSize: 6, tricepsSize: 6, forearmSize: 6, waistWidth: 3, gluteSize: 6, quadSize: 7, hamstringSize: 7, calfSize: 8, coreDefinition: 10, muscleDefinition: 10, bodyMass: 4 }),
  },
  {
    id: 'compact-powerhouse',
    label: 'Compact Powerhouse',
    description: 'A shorter frame packed with thick arms, legs, and torso mass.',
    build: buildWith({ height: 1, bodyScale: 8, neckThickness: 8, bicepsSize: 9, tricepsSize: 9, forearmSize: 9, quadSize: 9, calfSize: 8, bodyMass: 9 }),
  },
  {
    id: 'lower-body-specialist',
    label: 'Lower-Body Specialist',
    description: 'A balanced torso over especially powerful hips, thighs, and calves.',
    build: buildWith({ bodyScale: 6, shoulderWidth: 5, chestSize: 5, gluteSize: 10, quadSize: 10, hamstringSize: 10, calfSize: 9, footSize: 7 }),
  },
  {
    id: 'upper-body-specialist',
    label: 'Upper-Body Specialist',
    description: 'A dramatic upper-body taper with substantial arms and back width.',
    build: buildWith({ shoulderWidth: 10, trapeziusSize: 9, chestSize: 10, upperBackWidth: 10, bicepsSize: 10, tricepsSize: 10, forearmSize: 8, waistWidth: 3 }),
  },
  {
    id: 'classic-aesthetic',
    label: 'Classic Aesthetic',
    description: 'Long posing lines, a strong taper, full chest, sweeping quads, and balanced stage detail.',
    build: buildWith({ height: 7, clavicleWidth: 9, shoulderRoundness: 8, upperChestFullness: 8, latWidth: 9, latFlare: 9, waistWidth: 3, waistTaper: 10, bicepsPeak: 9, quadSweep: 9, calfWidth: 7, muscleSeparation: 9, posture: 9 }),
  },
  {
    id: 'mass-monster',
    label: 'Mass Monster',
    description: 'Maximum fictional muscle fullness across a thick torso, dense arms, and heavyweight legs.',
    build: buildWith({ bodyScale: 10, bodyMass: 10, muscleFullness: 10, pumpLevel: 9, clavicleWidth: 10, sideDeltSize: 10, upperChestFullness: 10, lowerChestFullness: 10, latWidth: 10, midBackThickness: 10, bicepsThickness: 10, forearmThickness: 9, midsectionThickness: 9, gluteFullness: 10, innerThighThickness: 10, calfWidth: 10 }),
  },
  {
    id: 'wide-back-specialist',
    label: 'Wide-Back Specialist',
    description: 'A broad clavicle frame with flared lats, rear delts, and layered back thickness.',
    build: buildWith({ clavicleWidth: 10, shoulderWidth: 10, rearDeltSize: 10, upperBackWidth: 10, latWidth: 10, latFlare: 10, midBackThickness: 9, trapeziusWidth: 9, waistTaper: 9, bicepsSize: 7, quadSize: 6 }),
  },
  {
    id: 'arm-specialist',
    label: 'Arm Specialist',
    description: 'High biceps peaks, dense triceps, thick forearms, and rounded delts frame a balanced torso.',
    build: buildWith({ bicepsSize: 10, bicepsPeak: 10, bicepsThickness: 10, tricepsSize: 10, tricepsHorseshoeDefinition: 10, forearmSize: 10, forearmThickness: 10, forearmVascularDefinition: 9, shoulderRoundness: 9, sideDeltSize: 9, pumpLevel: 9 }),
  },
  {
    id: 'chest-specialist',
    label: 'Chest Specialist',
    description: 'A full upper and lower chest sits over a controlled waist and sturdy upper-back base.',
    build: buildWith({ chestSize: 10, upperChestFullness: 10, lowerChestFullness: 10, clavicleWidth: 9, frontDeltSize: 9, ribcageWidth: 8, waistTaper: 8, tricepsSize: 8, posture: 9 }),
  },
  {
    id: 'shoulder-specialist',
    label: 'Shoulder Specialist',
    description: 'Distinct front, side, and rear delts create a wide capped silhouette without excessive torso mass.',
    build: buildWith({ clavicleWidth: 9, shoulderWidth: 10, shoulderRoundness: 10, frontDeltSize: 10, sideDeltSize: 10, rearDeltSize: 10, trapeziusHeight: 7, trapeziusWidth: 8, waistWidth: 3, waistTaper: 9 }),
  },
  {
    id: 'leg-specialist',
    label: 'Leg Specialist',
    description: 'Wide hips, full glutes, sweeping quads, dense inner thighs, dropped hamstrings, and full calves.',
    build: buildWith({ hipWidth: 8, gluteSize: 10, gluteFullness: 10, quadSize: 10, quadSweep: 10, innerThighThickness: 10, hamstringSize: 10, hamstringDrop: 10, calfSize: 10, calfWidth: 10, stanceWidth: 8, upperBackWidth: 5 }),
  },
  {
    id: 'posterior-chain-specialist',
    label: 'Posterior-Chain Specialist',
    description: 'Rear delts, traps, back thickness, glutes, hamstrings, and calves dominate the back view.',
    build: buildWith({ rearDeltSize: 10, trapeziusSize: 9, trapeziusHeight: 9, trapeziusWidth: 9, upperBackWidth: 9, midBackThickness: 10, lowerBackThickness: 10, gluteFullness: 10, hamstringDrop: 10, calfWidth: 9 }),
  },
  {
    id: 'balanced-stage-physique',
    label: 'Balanced Stage Physique',
    description: 'Symmetrical development, poised posture, complete limbs, and polished fictional stage presentation.',
    build: buildWith({ shoulderRoundness: 8, upperChestFullness: 8, latFlare: 8, bicepsPeak: 8, tricepsHorseshoeDefinition: 8, waistTaper: 8, abdominalDefinition: 8, quadSweep: 8, hamstringDrop: 8, calfWidth: 8, muscleSeparation: 8, symmetryPreference: 10, posture: 9 }),
  },
  {
    id: 'compact-heavyweight',
    label: 'Compact Heavyweight',
    description: 'A short, dense frame with a thick torso, powerful limbs, and a wide planted stance.',
    build: buildWith({ height: 1, bodyScale: 9, bodyMass: 10, neckThickness: 9, clavicleWidth: 8, midBackThickness: 9, bicepsThickness: 9, forearmThickness: 9, midsectionThickness: 9, hipWidth: 8, innerThighThickness: 9, ankleThickness: 8, stanceWidth: 8 }),
  },
  {
    id: 'lean-shredded',
    label: 'Lean Shredded',
    description: 'A lean muscular frame with high fictional separation, etched core detail, and restrained fullness.',
    build: buildWith({ height: 8, bodyScale: 3, bodyMass: 3, bodyFatPresentation: 0, muscleFullness: 5, muscleDefinition: 10, muscleSeparation: 10, vascularity: 8, forearmVascularDefinition: 9, abdominalDefinition: 10, obliqueDefinition: 10, serratusDefinition: 10, waistTaper: 9, posture: 9 }),
  },
  {
    id: 'off-season-power-build',
    label: 'Off-Season Power Build',
    description: 'A full, recovery-ready strength silhouette with dense legs, torso thickness, and lower visual separation.',
    build: buildWith({ bodyScale: 8, bodyMass: 9, bodyFatPresentation: 8, muscleFullness: 9, muscleSeparation: 3, vascularity: 1, ribcageWidth: 8, midsectionThickness: 9, lowerBackThickness: 9, hipWidth: 8, gluteFullness: 9, innerThighThickness: 9, ankleThickness: 7, posture: 6 }),
  },
];

export const DEFAULT_TRAINER_PHYSIQUE_PRESET_ID = 'balanced-athlete';

export const TRAINER_RANDOMIZATION_FILTERS: Array<{
  id: TrainerRandomizationFilter;
  label: string;
}> = [
  { id: 'any-physique', label: 'Any Physique' },
  { id: 'heavy-builds', label: 'Heavy Builds Only' },
  { id: 'lean-builds', label: 'Lean Builds Only' },
  { id: 'upper-body-dominant', label: 'Upper-Body Dominant' },
  { id: 'lower-body-dominant', label: 'Lower-Body Dominant' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'fantasy-gym-champion', label: 'Fantasy Gym Champion' },
  { id: 'realistic-athletic', label: 'Realistic Athletic' },
  { id: 'wild-colors', label: 'Wild Colors' },
  { id: 'neutral-colors', label: 'Neutral Colors' },
];

export const TRAINER_RANDOMIZATION_PRESET_IDS: Record<
  TrainerRandomizationFilter,
  readonly string[]
> = {
  'any-physique': TRAINER_PHYSIQUE_PRESETS.map(({ id }) => id),
  'heavy-builds': [
    'mass-monster',
    'open-bodybuilder',
    'heavy-powerlifter',
    'strongman',
    'compact-heavyweight',
    'off-season-power-build',
  ],
  'lean-builds': [
    'classic-aesthetic',
    'taper-performer',
    'lean-fighter',
    'lean-athlete',
    'lean-shredded',
  ],
  'upper-body-dominant': [
    'wide-back-specialist',
    'arm-specialist',
    'chest-specialist',
    'shoulder-specialist',
    'upper-body-specialist',
  ],
  'lower-body-dominant': [
    'leg-specialist',
    'posterior-chain-specialist',
    'lower-body-specialist',
    'platform-lifter',
  ],
  balanced: [
    'balanced-athlete',
    'balanced-stage-physique',
    'sculpted-physique',
    'figure-balance',
  ],
  'fantasy-gym-champion': [
    'mass-monster',
    'open-bodybuilder',
    'strongman',
    'balanced-stage-physique',
  ],
  'realistic-athletic': [
    'balanced-athlete',
    'classic-aesthetic',
    'lean-athlete',
    'figure-balance',
  ],
  'wild-colors': TRAINER_PHYSIQUE_PRESETS.map(({ id }) => id),
  'neutral-colors': TRAINER_PHYSIQUE_PRESETS.map(({ id }) => id),
};

function options(entries: Array<[string, string, string?]>): TrainerAppearanceOption[] {
  return entries.map(([id, label, description]) => ({ id, label, description }));
}

export const TRAINER_FACE_SHAPES = options([
  ['square-strong', 'Strong Square'],
  ['oval-athletic', 'Athletic Oval'],
  ['round-power', 'Power Round'],
  ['diamond-defined', 'Defined Diamond'],
  ['long-angular', 'Long Angular'],
  ['broad-soft', 'Broad Soft'],
]);
export const TRAINER_EYES = options([
  ['focused-round', 'Focused Round'],
  ['calm-wide', 'Calm Wide'],
  ['sharp-upturn', 'Sharp Upturn'],
  ['steady-downturn', 'Steady Downturn'],
  ['deep-set', 'Deep Set'],
  ['single-lid', 'Single Lid'],
  ['bright-arc', 'Bright Arc'],
  ['determined-narrow', 'Determined Narrow'],
]);
export const TRAINER_EYEBROWS = options([
  ['straight-bold', 'Straight Bold'],
  ['soft-arc', 'Soft Arc'],
  ['high-arc', 'High Arc'],
  ['angled-focus', 'Angled Focus'],
  ['short-thick', 'Short Thick'],
  ['fine-line', 'Fine Line'],
]);
export const TRAINER_NOSES = options([
  ['compact', 'Compact'],
  ['rounded', 'Rounded'],
  ['straight', 'Straight'],
  ['broad', 'Broad'],
  ['angular', 'Angular'],
  ['soft', 'Soft'],
]);
export const TRAINER_MOUTHS = options([
  ['steady', 'Steady'],
  ['small-smile', 'Small Smile'],
  ['wide-grin', 'Wide Grin'],
  ['determined', 'Determined'],
  ['soft-neutral', 'Soft Neutral'],
  ['bold-smirk', 'Bold Smirk'],
]);
export const TRAINER_EARS = options([
  ['close', 'Close Set'],
  ['rounded', 'Rounded'],
  ['angular', 'Angular'],
  ['prominent', 'Prominent'],
]);
export const TRAINER_FACIAL_HAIR = options([
  ['none', 'None'],
  ['stubble', 'Stubble'],
  ['goatee', 'Goatee'],
  ['short-boxed', 'Short Boxed'],
  ['full-beard', 'Full Beard'],
  ['mustache', 'Mustache'],
  ['chin-strap', 'Chin Strap'],
]);
export const TRAINER_SCARS = options([
  ['none', 'None'],
  ['brow-notch', 'Brow Notch'],
  ['cheek-line', 'Cheek Line'],
  ['double-cheek', 'Double Cheek'],
  ['chin-mark', 'Chin Mark'],
]);
export const TRAINER_FRECKLES = options([
  ['none', 'None'],
  ['light', 'Light'],
  ['nose-bridge', 'Nose Bridge'],
  ['full', 'Full'],
]);
export const TRAINER_TATTOOS = options([
  ['none', 'None'],
  ['arm-bands', 'Arm Bands'],
  ['shoulder-sun', 'Shoulder Sun'],
  ['geometric-sleeve', 'Geometric Sleeve'],
  ['back-chevron', 'Back Chevron'],
  ['leg-stripes', 'Leg Stripes'],
]);
export const TRAINER_FACE_PAINT = options([
  ['none', 'None'],
  ['under-eye-stripe', 'Under-Eye Stripe'],
  ['temple-bars', 'Temple Bars'],
  ['split-chevron', 'Split Chevron'],
  ['competition-dots', 'Competition Dots'],
]);
export const TRAINER_HAIR_STYLES = options([
  ['bald', 'Bald'],
  ['buzz', 'Buzz Cut'],
  ['close-crop', 'Close Crop'],
  ['fade-curl', 'Fade Curls'],
  ['coils-high', 'High Coils'],
  ['waves', 'Waves'],
  ['braids-back', 'Braids Back'],
  ['locs-tied', 'Tied Locs'],
  ['mohawk-soft', 'Soft Mohawk'],
  ['side-sweep', 'Side Sweep'],
  ['ponytail', 'Ponytail'],
  ['top-knot', 'Top Knot'],
]);
export const TRAINER_HAIR_LENGTHS = options([
  ['none', 'None'],
  ['short', 'Short'],
  ['medium', 'Medium'],
  ['long', 'Long'],
]);

export const TRAINER_TOPS = options([
  ['tee-panel', 'Panel Shirt'],
  ['tank-racer', 'Racerback Tank'],
  ['tank-stringer', 'Stringer Tank'],
  ['pump-cover-oversized', 'Oversized Pump Cover'],
  ['hoodie-sleeveless', 'Sleeveless Hoodie'],
  ['hoodie-training', 'Training Hoodie'],
  ['compression-short', 'Compression Top'],
  ['compression-long', 'Long Compression Top'],
  ['posing-top', 'Competition Posing Top'],
]);
export const TRAINER_BOTTOMS = options([
  ['shorts-split', 'Split Shorts'],
  ['shorts-training', 'Training Shorts'],
  ['shorts-posing', 'Competition Posing Shorts'],
  ['joggers-taper', 'Tapered Joggers'],
  ['leggings-panel', 'Panel Leggings'],
]);
export const TRAINER_SHOES = options([
  ['trainer-low', 'Low Trainers'],
  ['trainer-high', 'High Trainers'],
  ['lifting-flat', 'Flat Lifters'],
  ['lifting-raised', 'Raised Lifting Shoes'],
  ['runner-light', 'Light Runners'],
  ['boot-strong', 'Strong Boots'],
  ['wrap-shoes', 'Wrap Shoes'],
]);
export const TRAINER_SOCKS = options([
  ['none', 'No Visible Socks'],
  ['ankle', 'Ankle'],
  ['crew', 'Crew'],
  ['knee', 'Knee High'],
]);
export const TRAINER_GLOVES = options([
  ['none', 'None'],
  ['fingerless', 'Fingerless'],
  ['full-grip', 'Full Grip'],
  ['padded', 'Padded'],
  ['taped', 'Taped Hands'],
]);
export const TRAINER_WRIST_WRAPS = options([
  ['none', 'None'],
  ['single', 'Single Wrap'],
  ['double', 'Double Wrap'],
  ['long', 'Long Wrap'],
]);
export const TRAINER_ELBOW_SLEEVES = options([
  ['none', 'None'],
  ['short', 'Short Sleeve'],
  ['reinforced', 'Reinforced'],
]);
export const TRAINER_KNEE_SLEEVES = options([
  ['none', 'None'],
  ['short', 'Short Sleeve'],
  ['reinforced', 'Reinforced'],
]);
export const TRAINER_LOGO_SHAPES = options([
  ['none', 'No Logo'],
  ['forge-diamond', 'Forge Diamond'],
  ['pulse-plate', 'Pulse Plate'],
  ['split-anvil', 'Split Anvil'],
  ['summit-bars', 'Summit Bars'],
]);
export const TRAINER_CHALK_MARKS = options([
  ['none', 'No Chalk'],
  ['palms', 'Palm Chalk'],
  ['wrap-dust', 'Wrap Dust'],
  ['shoulder-smudge', 'Shoulder Smudge'],
]);
export const TRAINER_HEADWEAR = options([
  ['none', 'None'],
  ['headband', 'Headband'],
  ['wide-headband', 'Wide Headband'],
  ['cap-forward', 'Training Cap'],
  ['beanie', 'Gym Beanie'],
]);
export const TRAINER_BELTS = options([
  ['none', 'None'],
  ['slim', 'Slim Belt'],
  ['lifting-wide', 'Wide Lifting Belt'],
  ['champion-sash', 'Champion Sash'],
]);
export const TRAINER_GYM_BAGS = options([
  ['none', 'None'],
  ['duffel-small', 'Compact Duffel'],
  ['duffel-large', 'Heavy Duffel'],
  ['sling-pack', 'Sling Pack'],
]);
export const TRAINER_JEWELRY = options([
  ['none', 'None'],
  ['studs', 'Studs'],
  ['small-hoops', 'Small Hoops'],
  ['chain-short', 'Short Chain'],
  ['bracelet', 'Bracelet'],
]);
export const TRAINER_FANTASY_ACCESSORIES = options([
  ['none', 'None'],
  ['cape-short', 'Short Victory Cape'],
  ['cape-banner', 'Banner Cape'],
  ['aura-ribbon', 'Aura Ribbon'],
  ['shoulder-mantle', 'Champion Mantle'],
]);
export const TRAINER_TOWELS = options([
  ['none', 'No Towel'],
  ['shoulder-small', 'Shoulder Towel'],
  ['belt-loop', 'Belt-Loop Towel'],
  ['gym-stripe', 'Striped Gym Towel'],
]);

export const TRAINER_SKIN_TONES: TrainerColorOption[] = [
  { id: 'porcelain-warm', label: 'Porcelain Warm', hex: '#f3d7c3' },
  { id: 'ivory-neutral', label: 'Ivory Neutral', hex: '#eac7ae' },
  { id: 'sand-gold', label: 'Sand Gold', hex: '#ddb28c' },
  { id: 'honey-warm', label: 'Honey Warm', hex: '#cf966a' },
  { id: 'amber-neutral', label: 'Amber Neutral', hex: '#bd7d57' },
  { id: 'copper-rich', label: 'Copper Rich', hex: '#aa6849' },
  { id: 'umber-warm', label: 'Umber Warm', hex: '#92543d' },
  { id: 'mahogany-neutral', label: 'Mahogany Neutral', hex: '#783f31' },
  { id: 'espresso-cool', label: 'Espresso Cool', hex: '#603127' },
  { id: 'deep-ebony', label: 'Deep Ebony', hex: '#47231e' },
  { id: 'rose-brown', label: 'Rose Brown', hex: '#9d665b' },
  { id: 'olive-gold', label: 'Olive Gold', hex: '#b18b62' },
];

export const TRAINER_COLOR_OPTIONS: TrainerColorOption[] = [
  { id: 'ink', label: 'Ink', hex: '#17262b' },
  { id: 'chalk', label: 'Chalk', hex: '#eef2d0' },
  { id: 'mint', label: 'Mint', hex: '#68d39b' },
  { id: 'coral', label: 'Coral', hex: '#ef765f' },
  { id: 'amber', label: 'Amber', hex: '#f2c14e' },
  { id: 'ocean', label: 'Ocean', hex: '#3787c8' },
  { id: 'sky', label: 'Sky', hex: '#79c6e8' },
  { id: 'plum', label: 'Plum', hex: '#80558f' },
  { id: 'orchid', label: 'Orchid', hex: '#c38ad4' },
  { id: 'brick', label: 'Brick', hex: '#a84646' },
  { id: 'moss', label: 'Moss', hex: '#5c7842' },
  { id: 'teal', label: 'Teal', hex: '#287b78' },
  { id: 'navy', label: 'Navy', hex: '#263d63' },
  { id: 'copper', label: 'Copper', hex: '#b66a3c' },
  { id: 'rose', label: 'Rose', hex: '#d56f91' },
  { id: 'silver', label: 'Silver', hex: '#9eabb0' },
  { id: 'gold', label: 'Gold', hex: '#d7a72f' },
  { id: 'violet', label: 'Violet', hex: '#5e4bb2' },
];

export const TRAINER_APPEARANCE_OPTION_GROUPS = {
  faceShapes: TRAINER_FACE_SHAPES,
  eyes: TRAINER_EYES,
  eyebrows: TRAINER_EYEBROWS,
  noses: TRAINER_NOSES,
  mouths: TRAINER_MOUTHS,
  ears: TRAINER_EARS,
  facialHair: TRAINER_FACIAL_HAIR,
  scars: TRAINER_SCARS,
  freckles: TRAINER_FRECKLES,
  tattoos: TRAINER_TATTOOS,
  facePaint: TRAINER_FACE_PAINT,
  hairStyles: TRAINER_HAIR_STYLES,
  hairLengths: TRAINER_HAIR_LENGTHS,
  tops: TRAINER_TOPS,
  bottoms: TRAINER_BOTTOMS,
  shoes: TRAINER_SHOES,
  socks: TRAINER_SOCKS,
  gloves: TRAINER_GLOVES,
  wristWraps: TRAINER_WRIST_WRAPS,
  elbowSleeves: TRAINER_ELBOW_SLEEVES,
  kneeSleeves: TRAINER_KNEE_SLEEVES,
  logoShapes: TRAINER_LOGO_SHAPES,
  chalkMarks: TRAINER_CHALK_MARKS,
  headwear: TRAINER_HEADWEAR,
  belts: TRAINER_BELTS,
  gymBags: TRAINER_GYM_BAGS,
  jewelry: TRAINER_JEWELRY,
  fantasy: TRAINER_FANTASY_ACCESSORIES,
  towels: TRAINER_TOWELS,
} as const;

export const DEFAULT_TRAINER_APPEARANCE: TrainerAppearance = {
  version: TRAINER_APPEARANCE_VERSION,
  build: { ...BALANCED_BUILD },
  face: {
    shapeId: 'square-strong',
    eyesId: 'focused-round',
    eyebrowsId: 'straight-bold',
    noseId: 'straight',
    mouthId: 'small-smile',
    earsId: 'rounded',
    facialHairId: 'none',
    scarId: 'none',
    frecklesId: 'none',
    tattooId: 'none',
    facePaintId: 'none',
  },
  hair: {
    styleId: 'close-crop',
    lengthId: 'short',
    colorId: 'ink',
    highlightColorId: 'copper',
  },
  outfit: {
    topId: 'tank-racer',
    bottomsId: 'shorts-training',
    shoesId: 'trainer-low',
    socksId: 'ankle',
    glovesId: 'fingerless',
    wristWrapsId: 'single',
    elbowSleevesId: 'none',
    kneeSleevesId: 'none',
    logoShapeId: 'forge-diamond',
    chalkMarksId: 'none',
  },
  colors: {
    skinToneId: 'honey-warm',
    topPrimaryId: 'ocean',
    topSecondaryId: 'navy',
    topAccentId: 'amber',
    bottomPrimaryId: 'ink',
    bottomSecondaryId: 'teal',
    shoePrimaryId: 'chalk',
    shoeAccentId: 'coral',
    accessoryPrimaryId: 'amber',
    accessoryAccentId: 'mint',
    trimColorId: 'amber',
    logoColorId: 'chalk',
  },
  accessories: {
    headwearId: 'none',
    beltId: 'slim',
    gymBagId: 'none',
    jewelryId: 'none',
    fantasyId: 'none',
    towelId: 'none',
  },
};

export function cloneTrainerAppearance(
  appearance: TrainerAppearance,
): TrainerAppearance {
  return {
    ...appearance,
    build: { ...appearance.build },
    face: { ...appearance.face },
    hair: { ...appearance.hair },
    outfit: { ...appearance.outfit },
    colors: { ...appearance.colors },
    accessories: { ...appearance.accessories },
  };
}

export function getTrainerPhysiquePresetById(id: string) {
  const preset = TRAINER_PHYSIQUE_PRESETS.find((entry) => entry.id === id);
  if (!preset) throw new Error(`Unknown trainer physique preset "${id}".`);
  return preset;
}

export function getTrainerColorHex(id: string, fallbackId = 'ink') {
  return (
    TRAINER_COLOR_OPTIONS.find((entry) => entry.id === id) ??
    TRAINER_COLOR_OPTIONS.find((entry) => entry.id === fallbackId) ??
    TRAINER_COLOR_OPTIONS[0]!
  ).hex;
}

export function getTrainerSkinToneHex(id: string) {
  return (
    TRAINER_SKIN_TONES.find((entry) => entry.id === id) ??
    TRAINER_SKIN_TONES.find((entry) => entry.id === DEFAULT_TRAINER_APPEARANCE.colors.skinToneId) ??
    TRAINER_SKIN_TONES[0]!
  ).hex;
}

function colorDistance(left: string, right: string) {
  const rgb = (hex: string) => {
    const value = Number.parseInt(hex.replace('#', ''), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
  };
  const [lr, lg, lb] = rgb(left);
  const [rr, rg, rb] = rgb(right);
  return (lr - rr) ** 2 + (lg - rg) ** 2 + (lb - rb) ** 2;
}

export function closestTrainerColorId(
  hex: string,
  palette: readonly TrainerColorOption[] = TRAINER_COLOR_OPTIONS,
) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return palette[0]!.id;
  return [...palette].sort(
    (left, right) =>
      colorDistance(hex, left.hex) - colorDistance(hex, right.hex),
  )[0]!.id;
}

export function createLegacyTrainerAppearance(colors: {
  skin?: unknown;
  hair?: unknown;
  top?: unknown;
  shoes?: unknown;
  glove?: unknown;
}): TrainerAppearance {
  const next = cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE);
  if (typeof colors.skin === 'string') {
    next.colors.skinToneId = closestTrainerColorId(colors.skin, TRAINER_SKIN_TONES);
  }
  if (typeof colors.hair === 'string') {
    next.hair.colorId = closestTrainerColorId(colors.hair);
  }
  if (typeof colors.top === 'string') {
    next.colors.topPrimaryId = closestTrainerColorId(colors.top);
  }
  if (typeof colors.shoes === 'string') {
    next.colors.shoePrimaryId = closestTrainerColorId(colors.shoes);
  }
  if (typeof colors.glove === 'string') {
    next.colors.accessoryPrimaryId = closestTrainerColorId(colors.glove);
  }
  return next;
}

export function trainerAppearanceLegacyPalette(appearance: TrainerAppearance) {
  return {
    skin: getTrainerSkinToneHex(appearance.colors.skinToneId),
    hair:
      appearance.hair.styleId === 'bald'
        ? getTrainerSkinToneHex(appearance.colors.skinToneId)
        : getTrainerColorHex(appearance.hair.colorId),
    top: getTrainerColorHex(appearance.colors.topPrimaryId, 'ocean'),
    shoes: getTrainerColorHex(appearance.colors.shoePrimaryId, 'chalk'),
    glove: getTrainerColorHex(appearance.colors.accessoryPrimaryId, 'amber'),
  };
}

export function trainerBuildKeys(): TrainerBuildAttributeId[] {
  return TRAINER_BUILD_ATTRIBUTES.map((attribute) => attribute.id);
}
