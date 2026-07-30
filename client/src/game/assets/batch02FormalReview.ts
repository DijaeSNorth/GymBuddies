import type { AssetManifest, AssetStatus } from './types';

export const BATCH_02_FORMAL_REVIEW_DATE = '2026-07-30';

export type Batch02ReviewProfile =
  | 'overworld'
  | 'menu'
  | 'battle'
  | 'showcase'
  | 'portrait'
  | 'boss-tier-overlay';

export type Batch02FormalReviewReceipt = Readonly<{
  id: string;
  characterId:
    | 'ripped-rhino'
    | 'spotmole'
    | 'titan-gorilla'
    | 'a-rhino';
  profile: Batch02ReviewProfile;
  authoredResolution: '24x24' | '32x32' | '48x48' | '64x64';
  assetKeys: readonly string[];
  status: AssetStatus;
  assetVersion: '1.0.0';
  reviewDate: typeof BATCH_02_FORMAL_REVIEW_DATE;
  reviewerNote: string;
  knownLimitation: string;
  requiredRevision: string;
  proceduralFallbackEnabled: true;
}>;

const REVIEW_COMMON = {
  status: 'revision-required',
  assetVersion: '1.0.0',
  reviewDate: BATCH_02_FORMAL_REVIEW_DATE,
  proceduralFallbackEnabled: true,
} as const;

const OVERWORLD_KEYS = {
  railhorn: [
    'buddy.ripped-rhino.authored.v1.front',
    'buddy.ripped-rhino.authored.v1.back',
    'buddy.ripped-rhino.authored.v1.left',
    'buddy.ripped-rhino.authored.v1.right',
  ],
  spotmole: [
    'buddy.spotmole.authored.v1.front',
    'buddy.spotmole.authored.v1.back',
    'buddy.spotmole.authored.v1.left',
    'buddy.spotmole.authored.v1.right',
  ],
  knuckledge: [
    'buddy.titan-gorilla.authored.v1.front',
    'buddy.titan-gorilla.authored.v1.back',
    'buddy.titan-gorilla.authored.v1.left',
    'buddy.titan-gorilla.authored.v1.right',
  ],
} as const;

export const BATCH_02_FORMAL_REVIEW_RECEIPTS = [
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.railhorn.overworld.v1',
    characterId: 'ripped-rhino',
    profile: 'overworld',
    authoredResolution: '24x24',
    assetKeys: OVERWORLD_KEYS.railhorn,
    reviewerNote:
      'Horn and planted stance survive all four directions, but the combined silhouette is not production-approved.',
    knownLimitation:
      'Broad equipment stacks flatten plate gaps and can make the torso read as a rectangle.',
    requiredRevision:
      'Re-author species-shaped wrap, chain, belt, and sleeve anchors while retaining the visible horn and joint gaps.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.railhorn.menu.v1',
    characterId: 'ripped-rhino',
    profile: 'menu',
    authoredResolution: '32x32',
    assetKeys: ['buddy.ripped-rhino.presentation.v1.menu'],
    reviewerNote:
      'Direction identity is readable, including the asymmetric rail horn.',
    knownLimitation:
      'Compact, Broad, and Specialized changes are too dependent on small overlays and generic accessory placement.',
    requiredRevision:
      'Separate the shoulder plates and flexible joints more clearly and give Broad a tapered, non-rectangular shell silhouette.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.railhorn.battle.v1',
    characterId: 'ripped-rhino',
    profile: 'battle',
    authoredResolution: '48x48',
    assetKeys: ['buddy.ripped-rhino.presentation.v1.battle'],
    reviewerNote:
      'Side-facing hook and counter poses retain the horn and low center of gravity.',
    knownLimitation:
      'Several front actions are nearly interchangeable, and pump seams do not carry enough state at native scale.',
    requiredRevision:
      'Strengthen attack silhouettes, fatigue posture, flexible-joint motion, and neutral-versus-pumped seam contrast.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.railhorn.showcase.v1',
    characterId: 'ripped-rhino',
    profile: 'showcase',
    authoredResolution: '64x64',
    assetKeys: ['buddy.ripped-rhino.presentation.v1.showcase'],
    reviewerNote:
      'Front, back, and side identity remain recognizable.',
    knownLimitation:
      'Bodybuilding pose silhouettes and dorsal-shell depth are too similar between named poses.',
    requiredRevision:
      'Re-author pose-specific plate rotation, exposed-joint flex, dorsal depth, and fatigue posture without inflating rigid armor.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.railhorn.portrait.v1',
    characterId: 'ripped-rhino',
    profile: 'portrait',
    authoredResolution: '64x64',
    assetKeys: ['buddy.ripped-rhino.presentation.v1.portrait'],
    reviewerNote:
      'Palette and horn identity match the gameplay sprites.',
    knownLimitation:
      'The frame reads as a full-body showcase sprite rather than a purpose-authored portrait.',
    requiredRevision:
      'Author a closer expression-led portrait with readable horn, chest segmentation, and shoulder plates.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.spotmole.overworld.v1',
    characterId: 'spotmole',
    profile: 'overworld',
    authoredResolution: '24x24',
    assetKeys: OVERWORLD_KEYS.spotmole,
    reviewerNote:
      'The low stance and compact torso are readable in all four directions.',
    knownLimitation:
      'Shovel hands, short-limb motion, and digging identity collapse into generic square hands at native scale.',
    requiredRevision:
      'Widen the shovel-hand silhouette and animate the shoulders, hips, and short steps as one compact power chain.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.spotmole.menu.v1',
    characterId: 'spotmole',
    profile: 'menu',
    authoredResolution: '32x32',
    assetKeys: ['buddy.spotmole.presentation.v1.menu'],
    reviewerNote:
      'Head-to-torso ratio stays compact and distinct from the heavy biped.',
    knownLimitation:
      'Preset changes and accessory scale are too subtle to communicate a muscular powerhouse.',
    requiredRevision:
      'Clarify ruff, core, leg mass, stance width, and shovel-hand accessories for each physique.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.spotmole.battle.v1',
    characterId: 'spotmole',
    profile: 'battle',
    authoredResolution: '48x48',
    assetKeys: ['buddy.spotmole.presentation.v1.battle'],
    reviewerNote:
      'The character remains compact and grounded throughout the action row.',
    knownLimitation:
      'Grappling, digging, preparation, counters, and stamina loss are not distinct enough at native size.',
    requiredRevision:
      'Re-author action-specific shovel-hand angles, stance compression, leg drive, and expressions.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.spotmole.showcase.v1',
    characterId: 'spotmole',
    profile: 'showcase',
    authoredResolution: '64x64',
    assetKeys: ['buddy.spotmole.presentation.v1.showcase'],
    reviewerNote:
      'The larger frame retains the compact species silhouette.',
    knownLimitation:
      'Most named poses differ by only a few hand pixels and do not reveal core or leg emphasis.',
    requiredRevision:
      'Build pose-specific ruff, shovel-hand, core, and thigh silhouettes while keeping the short-limb anatomy.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.spotmole.portrait.v1',
    characterId: 'spotmole',
    profile: 'portrait',
    authoredResolution: '64x64',
    assetKeys: ['buddy.spotmole.presentation.v1.portrait'],
    reviewerNote:
      'The palette and central face mark remain consistent.',
    knownLimitation:
      'The image is a full-body enlargement with minimal facial personality.',
    requiredRevision:
      'Author a portrait crop with expressive eyes, ruff, shovel-hand framing, and species markings.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.knuckledge.overworld.v1',
    characterId: 'titan-gorilla',
    profile: 'overworld',
    authoredResolution: '24x24',
    assetKeys: OVERWORLD_KEYS.knuckledge,
    reviewerNote:
      'Long bridge arms and slab knuckles establish a recognizable heavy biped.',
    knownLimitation:
      'Side directions, arm swing, and leg support do not yet communicate controlled moving weight.',
    requiredRevision:
      'Rebalance shoulder roll, hip support, knuckle contact, and side-frame arm swing without slowing the pose.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.knuckledge.menu.v1',
    characterId: 'titan-gorilla',
    profile: 'menu',
    authoredResolution: '32x32',
    assetKeys: ['buddy.titan-gorilla.presentation.v1.menu'],
    reviewerNote:
      'The back bridge and long-arm identity survive menu reduction.',
    knownLimitation:
      'Facial readability and the difference between Broad, Specialized, and Climber are weak.',
    requiredRevision:
      'Clarify chest depth, back width, leg support, face, and physique-specific shoulder-to-hand rhythm.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.knuckledge.battle.v1',
    characterId: 'titan-gorilla',
    profile: 'battle',
    authoredResolution: '48x48',
    assetKeys: ['buddy.titan-gorilla.presentation.v1.battle'],
    reviewerNote:
      'The neutral frame communicates mass through the long loaded arms.',
    knownLimitation:
      'Required side-facing actions are absent and most actions retain the same front silhouette.',
    requiredRevision:
      'Author side attack frames, visible slab-knuckle arcs, shoulder/back compression, facial tells, and supported leg drive.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.knuckledge.showcase.v1',
    characterId: 'titan-gorilla',
    profile: 'showcase',
    authoredResolution: '64x64',
    assetKeys: ['buddy.titan-gorilla.presentation.v1.showcase'],
    reviewerNote:
      'The heavy-biped silhouette remains recognizable front and back.',
    knownLimitation:
      'Pose, pump, chest-depth, and back-width changes are too slight for a showcase context.',
    requiredRevision:
      'Re-author pose-specific shoulder bridge, chest projection, back spread, knuckle plant, and fatigue weight shift.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.knuckledge.portrait.v1',
    characterId: 'titan-gorilla',
    profile: 'portrait',
    authoredResolution: '64x64',
    assetKeys: ['buddy.titan-gorilla.presentation.v1.portrait'],
    reviewerNote:
      'The dark bridge silhouette and warm chest palette remain consistent.',
    knownLimitation:
      'The full-body framing leaves too few pixels for face and expression.',
    requiredRevision:
      'Author a head-and-shoulder portrait that keeps the bridge shoulders and adds readable expression.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.a-rhino.overworld.v1',
    characterId: 'a-rhino',
    profile: 'overworld',
    authoredResolution: '24x24',
    assetKeys: OVERWORLD_KEYS.railhorn,
    reviewerNote:
      'The boss remains visibly derived from Railhorn at overworld size.',
    knownLimitation:
      'Shared species strips cannot carry enough A-Rhino harness, expression, or tier identity alone.',
    requiredRevision:
      'Add boss-safe overlays that retain horn, joints, harness anchors, and tier readability in every direction.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.a-rhino.tiers.v1',
    characterId: 'a-rhino',
    profile: 'boss-tier-overlay',
    authoredResolution: '24x24',
    assetKeys: ['boss.a-rhino.authored.v1.tiers'],
    reviewerNote:
      'The five tiers avoid wounded or cracked-armor imagery.',
    knownLimitation:
      'Pumped and Overload are too similar, while Final Round changes orientation too sharply.',
    requiredRevision:
      'Escalate seams, posture, harness state, expression, and timing while keeping a consistent camera-facing identity.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.a-rhino.menu.v1',
    characterId: 'a-rhino',
    profile: 'menu',
    authoredResolution: '32x32',
    assetKeys: ['boss.a-rhino.presentation.v1.menu'],
    reviewerNote:
      'Boss palette and rail horn are readable in the four-direction row.',
    knownLimitation:
      'Harness details and boss expression do not remain equally legible across directions.',
    requiredRevision:
      'Strengthen harness, red chest motif, and expression without obscuring the horn or plate gaps.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.a-rhino.battle.v1',
    characterId: 'a-rhino',
    profile: 'battle',
    authoredResolution: '64x64',
    assetKeys: ['boss.a-rhino.presentation.v1.battle'],
    reviewerNote:
      'Normal and Defeated remain non-graphic and broadly recognizable.',
    knownLimitation:
      'The 48-pixel derived comparison loses boss identity, and Final Round shifts orientation and silhouette abruptly.',
    requiredRevision:
      'Unify all five tiers around one silhouette, then vary seams, stance, harness, expression, and timing rather than viewpoint.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.a-rhino.showcase.v1',
    characterId: 'a-rhino',
    profile: 'showcase',
    authoredResolution: '64x64',
    assetKeys: ['boss.a-rhino.presentation.v1.showcase'],
    reviewerNote:
      'The showcase preserves armor volume instead of inflating rigid plates.',
    knownLimitation:
      'Tier escalation and bodybuilding poses remain too similar in posture and exposed musculature.',
    requiredRevision:
      'Clarify harness configuration, stance, seam intensity, exposed joints, and humbled Defeated posture per tier.',
  },
  {
    ...REVIEW_COMMON,
    id: 'batch02.review.a-rhino.portrait.v1',
    characterId: 'a-rhino',
    profile: 'portrait',
    authoredResolution: '64x64',
    assetKeys: ['boss.a-rhino.presentation.v1.portrait'],
    reviewerNote:
      'The red harness motif and horn connect the portrait to A-Rhino.',
    knownLimitation:
      'It is framed as a full-body card and lacks a clearly readable boss expression.',
    requiredRevision:
      'Author a closer boss portrait with horn clearance, harness identity, facial expression, and tier-neutral plate geometry.',
  },
] as const satisfies readonly Batch02FormalReviewReceipt[];

function isBatch02AssetKey(key: string) {
  return (
    key.startsWith('buddy.ripped-rhino.authored.v1.') ||
    key.startsWith('buddy.spotmole.authored.v1.') ||
    key.startsWith('buddy.titan-gorilla.authored.v1.') ||
    key.startsWith('buddy.ripped-rhino.presentation.v1.') ||
    key.startsWith('buddy.spotmole.presentation.v1.') ||
    key.startsWith('buddy.titan-gorilla.presentation.v1.') ||
    key.startsWith('boss.a-rhino.authored.v1.') ||
    key.startsWith('boss.a-rhino.presentation.v1.')
  );
}

export function validateBatch02FormalReview(
  manifest: AssetManifest,
): readonly string[] {
  const errors: string[] = [];
  const receiptIds = new Set<string>();
  const coveredKeys = new Set<string>();
  const assetByKey = new Map(manifest.assets.map((asset) => [asset.key, asset]));

  for (const receipt of BATCH_02_FORMAL_REVIEW_RECEIPTS) {
    if (receiptIds.has(receipt.id)) {
      errors.push(`Duplicate Batch 02 review receipt "${receipt.id}".`);
    }
    receiptIds.add(receipt.id);
    if (receipt.status !== 'revision-required') {
      errors.push(`Receipt "${receipt.id}" bypasses the formal revision gate.`);
    }
    if (!receipt.proceduralFallbackEnabled) {
      errors.push(`Receipt "${receipt.id}" disables its procedural fallback.`);
    }
    for (const assetKey of receipt.assetKeys) {
      coveredKeys.add(assetKey);
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
        errors.push(
          `Asset "${assetKey}" version does not match receipt "${receipt.id}".`,
        );
      }
    }
  }

  for (const asset of manifest.assets.filter((entry) =>
    isBatch02AssetKey(entry.key),
  )) {
    if (!coveredKeys.has(asset.key)) {
      errors.push(`Batch 02 asset "${asset.key}" has no formal review receipt.`);
    }
    if (asset.status === 'approved' || asset.status === 'final') {
      errors.push(`Batch 02 asset "${asset.key}" was promoted without approval.`);
    }
  }
  return errors;
}
