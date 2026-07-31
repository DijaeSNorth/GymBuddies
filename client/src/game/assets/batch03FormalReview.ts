import type { AssetManifest, AssetStatus } from './types';

export const BATCH_03_FORMAL_REVIEW_DATE = '2026-07-30';

export type Batch03ReviewCharacter =
  | 'titan-tortoise'
  | 'ripped-rhino'
  | 'boulder-bison'
  | 'dome-warden';

export type Batch03ReviewProfile =
  | 'overworld'
  | 'menu'
  | 'battle'
  | 'showcase'
  | 'portrait'
  | 'boss-tier-overlay';

export type Batch03FormalReviewReceipt = Readonly<{
  id: string;
  characterId: Batch03ReviewCharacter;
  profile: Batch03ReviewProfile;
  authoredResolution: '24x24' | '32x32' | '48x48' | '64x64';
  assetKeys: readonly string[];
  status: AssetStatus;
  assetVersion: '3.0.0';
  reviewDate: typeof BATCH_03_FORMAL_REVIEW_DATE;
  reviewerNote: string;
  knownLimitation: string;
  requiredCorrection: string;
  proceduralFallbackEnabled: true;
  mayShipInAlpha: boolean;
}>;

const COMMON = {
  assetVersion: '3.0.0',
  reviewDate: BATCH_03_FORMAL_REVIEW_DATE,
  proceduralFallbackEnabled: true,
} as const;

const OVERWORLD_KEYS = {
  plastrong: [
    'buddy.titan-tortoise.authored.v3.front',
    'buddy.titan-tortoise.authored.v3.back',
    'buddy.titan-tortoise.authored.v3.left',
    'buddy.titan-tortoise.authored.v3.right',
  ],
  railhorn: [
    'buddy.ripped-rhino.authored.v3.front',
    'buddy.ripped-rhino.authored.v3.back',
    'buddy.ripped-rhino.authored.v3.left',
    'buddy.ripped-rhino.authored.v3.right',
  ],
  cairnox: [
    'buddy.boulder-bison.authored.v3.front',
    'buddy.boulder-bison.authored.v3.back',
    'buddy.boulder-bison.authored.v3.left',
    'buddy.boulder-bison.authored.v3.right',
  ],
} as const;

export const BATCH_03_FORMAL_REVIEW_RECEIPTS:
  readonly Batch03FormalReviewReceipt[] = [
  {
    ...COMMON,
    id: 'batch03.review.plastrong.overworld.v3',
    characterId: 'titan-tortoise',
    profile: 'overworld',
    authoredResolution: '24x24',
    assetKeys: OVERWORLD_KEYS.plastrong,
    status: 'review',
    reviewerNote:
      'The rigid dome, plastron, exposed limbs, and four authored directions remain recognizable at native scale.',
    knownLimitation:
      'Compact and Balanced are close, side plastron depth is shallow, and only two prioritized accessory cues fit safely.',
    requiredCorrection:
      'Clarify side plastron overlap and preset stance while retaining the specialized 24×24 accessory budget.',
    mayShipInAlpha: true,
  },
  {
    ...COMMON,
    id: 'batch03.review.plastrong.menu.v3',
    characterId: 'titan-tortoise',
    profile: 'menu',
    authoredResolution: '32x32',
    assetKeys: ['buddy.titan-tortoise.presentation.v3.menu'],
    status: 'review',
    reviewerNote:
      'The menu frame preserves the dome, palette, and low center of gravity.',
    knownLimitation:
      'Its compact horizontal read is not yet fully reconciled with the taller battle and showcase anatomy.',
    requiredCorrection:
      'Match neck length, shoulder openings, and limb proportions more closely across 32px, 48px, and 64px.',
    mayShipInAlpha: true,
  },
  {
    ...COMMON,
    id: 'batch03.review.plastrong.battle.v3',
    characterId: 'titan-tortoise',
    profile: 'battle',
    authoredResolution: '48x48',
    assetKeys: ['buddy.titan-tortoise.presentation.v3.battle'],
    status: 'revision-required',
    reviewerNote:
      'The battle strip retains species identity and never inflates the dome.',
    knownLimitation:
      'Most named actions share the same silhouette; near-pin, escape, and the three capture moves lack readable limb drive.',
    requiredCorrection:
      'Re-author action-specific neck, limb, stance, and plastron-angle changes while keeping rigid shell dimensions fixed.',
    mayShipInAlpha: false,
  },
  {
    ...COMMON,
    id: 'batch03.review.plastrong.showcase.v3',
    characterId: 'titan-tortoise',
    profile: 'showcase',
    authoredResolution: '64x64',
    assetKeys: ['buddy.titan-tortoise.presentation.v3.showcase'],
    status: 'revision-required',
    reviewerNote:
      'The 64px frame has sufficient room for the full dome and exposed-limb anatomy.',
    knownLimitation:
      'Front, back, side, double-biceps, and fatigue poses are visually too similar for a physique showcase.',
    requiredCorrection:
      'Author pose-specific limb flex, neck angle, stance, shell perspective, and back-plastron separation.',
    mayShipInAlpha: false,
  },
  {
    ...COMMON,
    id: 'batch03.review.plastrong.portrait.v3',
    characterId: 'titan-tortoise',
    profile: 'portrait',
    authoredResolution: '64x64',
    assetKeys: ['buddy.titan-tortoise.presentation.v3.portrait'],
    status: 'revision-required',
    reviewerNote:
      'Palette, shell seam, and species silhouette match the other resolutions.',
    knownLimitation:
      'The profile is full-body and expression-neutral, so face, personality, and shell surface detail are underused.',
    requiredCorrection:
      'Author an expression-led head-and-shoulder composition with readable neck opening and dome depth.',
    mayShipInAlpha: false,
  },
  {
    ...COMMON,
    id: 'batch03.review.railhorn.overworld.v3',
    characterId: 'ripped-rhino',
    profile: 'overworld',
    authoredResolution: '24x24',
    assetKeys: OVERWORLD_KEYS.railhorn,
    status: 'review',
    reviewerNote:
      'Version 3 keeps the rail horn clear and improves side-facing posture and plate taper over Batch 02 v1.',
    knownLimitation:
      'Broad and Specialized remain close at native scale, and the accessory matrix has not yet been re-authored for v3.',
    requiredCorrection:
      'Strengthen preset-specific shoulder plates and repeat the full extreme accessory pass before promotion.',
    mayShipInAlpha: true,
  },
  {
    ...COMMON,
    id: 'batch03.review.railhorn.menu.v3',
    characterId: 'ripped-rhino',
    profile: 'menu',
    authoredResolution: '32x32',
    assetKeys: ['buddy.ripped-rhino.presentation.v3.menu'],
    status: 'review',
    reviewerNote:
      'The horn, dark armor, and grounded center of gravity survive menu reduction.',
    knownLimitation:
      'Flexible joints and chest segmentation are still compressed into a narrow horizontal band.',
    requiredCorrection:
      'Open the shoulder gaps and preserve chest plate taper without losing the low armored profile.',
    mayShipInAlpha: true,
  },
  {
    ...COMMON,
    id: 'batch03.review.railhorn.battle.v3',
    characterId: 'ripped-rhino',
    profile: 'battle',
    authoredResolution: '48x48',
    assetKeys: ['buddy.ripped-rhino.presentation.v3.battle'],
    status: 'review',
    reviewerNote:
      'Version 3 gives Shoulder Burst, Snapping Hook, Counter, and Escape distinct side silhouettes while keeping the horn visible.',
    knownLimitation:
      'Front actions, fatigue, and facial tells still rely on small changes, and v3 lacks a complete accessory stress sheet.',
    requiredCorrection:
      'Increase joint compression, facial expression, pump seams, and accessory-aware action clearance.',
    mayShipInAlpha: true,
  },
  {
    ...COMMON,
    id: 'batch03.review.railhorn.showcase.v3',
    characterId: 'ripped-rhino',
    profile: 'showcase',
    authoredResolution: '64x64',
    assetKeys: ['buddy.ripped-rhino.presentation.v3.showcase'],
    status: 'review',
    reviewerNote:
      'Front, back, and side bodybuilding poses are more distinct than Batch 02 v1 and retain the rail-horn identity.',
    knownLimitation:
      'Exposed-joint flex and fatigue posture remain understated, and fabric/equipment lacks authored folds.',
    requiredCorrection:
      'Refine joint tissue, dorsal depth, fatigue weight shift, and pose-specific equipment movement.',
    mayShipInAlpha: true,
  },
  {
    ...COMMON,
    id: 'batch03.review.railhorn.portrait.v3',
    characterId: 'ripped-rhino',
    profile: 'portrait',
    authoredResolution: '64x64',
    assetKeys: ['buddy.ripped-rhino.presentation.v3.portrait'],
    status: 'revision-required',
    reviewerNote:
      'The horn and armor palette connect the portrait to Railhorn v3.',
    knownLimitation:
      'It remains a full-body card rather than a face-led portrait and does not communicate personality.',
    requiredCorrection:
      'Create a close portrait with horn clearance, readable eyes and mouth, shoulder plates, and chest segmentation.',
    mayShipInAlpha: false,
  },
  {
    ...COMMON,
    id: 'batch03.review.cairnox.overworld.v3',
    characterId: 'boulder-bison',
    profile: 'overworld',
    authoredResolution: '24x24',
    assetKeys: OVERWORLD_KEYS.cairnox,
    status: 'review',
    reviewerNote:
      'The flat rigid torso and four exposed pillar limbs create a unique bison-cairn silhouette.',
    knownLimitation:
      'Front and back differ mainly through internal markings, and Compact through Broad changes are subtle.',
    requiredCorrection:
      'Clarify shoulder overhang, rear mass, side torso depth, and stance without widening the rigid block uniformly.',
    mayShipInAlpha: true,
  },
  {
    ...COMMON,
    id: 'batch03.review.cairnox.menu.v3',
    characterId: 'boulder-bison',
    profile: 'menu',
    authoredResolution: '32x32',
    assetKeys: ['buddy.boulder-bison.presentation.v3.menu'],
    status: 'review',
    reviewerNote:
      'The horn line, stone torso, and hanging limbs remain distinct at menu size.',
    knownLimitation:
      'Exposed limb definition and front/back identity are weak at native 1×.',
    requiredCorrection:
      'Improve limb-to-torso contrast, rear markings, and side depth while preserving the rigid slab.',
    mayShipInAlpha: true,
  },
  {
    ...COMMON,
    id: 'batch03.review.cairnox.battle.v3',
    characterId: 'boulder-bison',
    profile: 'battle',
    authoredResolution: '48x48',
    assetKeys: ['buddy.boulder-bison.presentation.v3.battle'],
    status: 'revision-required',
    reviewerNote:
      'The battle frame keeps the rigid torso intact and the limbs visible.',
    knownLimitation:
      'All twelve actions are effectively the same pose; the rigid torso currently appears static rather than controlled.',
    requiredCorrection:
      'Author exposed-limb drive, torso tilt, horn tells, stance compression, secondary motion, and non-damaging fatigue.',
    mayShipInAlpha: false,
  },
  {
    ...COMMON,
    id: 'batch03.review.cairnox.showcase.v3',
    characterId: 'boulder-bison',
    profile: 'showcase',
    authoredResolution: '64x64',
    assetKeys: ['buddy.boulder-bison.presentation.v3.showcase'],
    status: 'revision-required',
    reviewerNote:
      'The rigid-over-flexible anatomy remains identifiable at 64px.',
    knownLimitation:
      'Named poses do not meaningfully change limbs, torso perspective, posture, or muscle emphasis.',
    requiredCorrection:
      'Design species-specific showcase poses using limb spread, torso angle, horn orientation, and controlled weight shift.',
    mayShipInAlpha: false,
  },
  {
    ...COMMON,
    id: 'batch03.review.cairnox.portrait.v3',
    characterId: 'boulder-bison',
    profile: 'portrait',
    authoredResolution: '64x64',
    assetKeys: ['buddy.boulder-bison.presentation.v3.portrait'],
    status: 'revision-required',
    reviewerNote:
      'The ochre limbs and stone torso match the gameplay palette.',
    knownLimitation:
      'The full-body framing leaves the face and expression unreadable.',
    requiredCorrection:
      'Author a close portrait with expressive eyes, horn base, stone texture, and exposed-neck transition.',
    mayShipInAlpha: false,
  },
  {
    ...COMMON,
    id: 'batch03.review.dome-warden.overworld.v3',
    characterId: 'dome-warden',
    profile: 'overworld',
    authoredResolution: '24x24',
    assetKeys: OVERWORLD_KEYS.plastrong,
    status: 'review',
    reviewerNote:
      'The shared Plastrong base keeps the boss recognizable and in bounds.',
    knownLimitation:
      'Boss identity depends on a separate overlay and cannot be judged from the shared base strip alone.',
    requiredCorrection:
      'Retain the shared base, but author boss-safe priority overlays for every direction before gameplay use.',
    mayShipInAlpha: false,
  },
  {
    ...COMMON,
    id: 'batch03.review.dome-warden.tiers.v3',
    characterId: 'dome-warden',
    profile: 'boss-tier-overlay',
    authoredResolution: '24x24',
    assetKeys: ['boss.dome-warden.authored.v3.tiers'],
    status: 'revision-required',
    reviewerNote:
      'All five tiers preserve shell dimensions and avoid cracks, wounds, or damage replacement.',
    knownLimitation:
      'Normal through Final Round differ mostly by seam color, while posture and equipment escalation are too subtle.',
    requiredCorrection:
      'Author tier-specific stance, harness, limb bend, expression, and timing while keeping the dome unchanged.',
    mayShipInAlpha: false,
  },
  {
    ...COMMON,
    id: 'batch03.review.dome-warden.menu.v3',
    characterId: 'dome-warden',
    profile: 'menu',
    authoredResolution: '32x32',
    assetKeys: ['boss.dome-warden.presentation.v3.menu'],
    status: 'revision-required',
    reviewerNote:
      'The green and gold palette clearly separates the boss from standard Plastrong.',
    knownLimitation:
      'The native frame is extremely small and does not retain harness or expression detail.',
    requiredCorrection:
      'Clarify the boss insignia and harness without overwhelming the dome or joint openings.',
    mayShipInAlpha: false,
  },
  {
    ...COMMON,
    id: 'batch03.review.dome-warden.battle.v3',
    characterId: 'dome-warden',
    profile: 'battle',
    authoredResolution: '64x64',
    assetKeys: ['boss.dome-warden.presentation.v3.battle'],
    status: 'revision-required',
    reviewerNote:
      'The boss battle frame retains Plastrong anatomy and a fixed rigid shell.',
    knownLimitation:
      'Actions and tiers are too similar at battle scale; boss intensity is not communicated through secondary motion.',
    requiredCorrection:
      'Re-author action and tier combinations with readable limb drive, harness changes, posture, breathing, and timing.',
    mayShipInAlpha: false,
  },
  {
    ...COMMON,
    id: 'batch03.review.dome-warden.showcase.v3',
    characterId: 'dome-warden',
    profile: 'showcase',
    authoredResolution: '64x64',
    assetKeys: ['boss.dome-warden.presentation.v3.showcase'],
    status: 'revision-required',
    reviewerNote:
      'Normal, Overload, Final Round, and Defeated remain the same recognizable character.',
    knownLimitation:
      'Escalation depends on seam light and equipment color more than pose; Defeated is subdued but only slightly humbled.',
    requiredCorrection:
      'Strengthen stance opening, neck angle, harness configuration, limb bend, and humbled Defeated posture.',
    mayShipInAlpha: false,
  },
  {
    ...COMMON,
    id: 'batch03.review.dome-warden.portrait.v3',
    characterId: 'dome-warden',
    profile: 'portrait',
    authoredResolution: '64x64',
    assetKeys: ['boss.dome-warden.presentation.v3.portrait'],
    status: 'revision-required',
    reviewerNote:
      'The palette and shell geometry match Dome Warden.',
    knownLimitation:
      'The full-body framing does not support a readable boss expression or introduction-card personality.',
    requiredCorrection:
      'Author a close portrait with expression, boss insignia, harness cue, and tier-neutral dome geometry.',
    mayShipInAlpha: false,
  },
];

function isBatch03AssetKey(key: string) {
  return (
    key.includes('.authored.v3.') ||
    key.includes('.presentation.v3.')
  );
}

export function validateBatch03FormalReview(
  manifest: AssetManifest,
): readonly string[] {
  const errors: string[] = [];
  const receiptIds = new Set<string>();
  const coveredKeys = new Set<string>();
  const statusByKey = new Map<string, AssetStatus>();
  const assetByKey = new Map(manifest.assets.map((asset) => [asset.key, asset]));

  for (const receipt of BATCH_03_FORMAL_REVIEW_RECEIPTS) {
    if (receiptIds.has(receipt.id)) {
      errors.push(`Duplicate Batch 03 review receipt "${receipt.id}".`);
    }
    receiptIds.add(receipt.id);
    if (receipt.status === 'approved' || receipt.status === 'final') {
      errors.push(`Receipt "${receipt.id}" bypasses the manual approval gate.`);
    }
    if (!receipt.proceduralFallbackEnabled) {
      errors.push(`Receipt "${receipt.id}" disables procedural fallback.`);
    }
    for (const assetKey of receipt.assetKeys) {
      coveredKeys.add(assetKey);
      const previous = statusByKey.get(assetKey);
      if (previous && previous !== receipt.status) {
        errors.push(`Asset "${assetKey}" has conflicting review statuses.`);
      }
      statusByKey.set(assetKey, receipt.status);
      const asset = assetByKey.get(assetKey);
      if (!asset) {
        errors.push(`Receipt "${receipt.id}" references missing asset "${assetKey}".`);
        continue;
      }
      if (asset.status !== receipt.status) {
        errors.push(
          `Asset "${assetKey}" is ${asset.status}; receipt requires ${receipt.status}.`,
        );
      }
      if (asset.assetVersion !== receipt.assetVersion) {
        errors.push(`Asset "${assetKey}" version does not match its receipt.`);
      }
    }
  }

  for (const asset of manifest.assets.filter((entry) =>
    isBatch03AssetKey(entry.key),
  )) {
    if (asset.assetVersion === '3.0.0' && !coveredKeys.has(asset.key)) {
      errors.push(`Batch 03 asset "${asset.key}" lacks a formal receipt.`);
    }
    if (
      asset.assetVersion === '3.0.0' &&
      (asset.status === 'approved' || asset.status === 'final')
    ) {
      errors.push(`Batch 03 asset "${asset.key}" was accidentally promoted.`);
    }
  }
  return errors;
}
