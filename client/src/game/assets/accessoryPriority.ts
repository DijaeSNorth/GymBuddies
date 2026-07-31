import type {
  BuddyFacingDirection,
} from '../types';
import {
  PLASTRONG_ACCESSORY_IDS,
  PLASTRONG_ACCESSORY_MOUNTS,
  type PlastrongAccessoryId,
} from './domeShellModules';
import type { BuddyPresentationContext } from './types';

export type AccessoryPresentation = 'full' | 'simplified' | 'hidden';

export type PlastrongAccessoryPriorityRule = Readonly<{
  accessoryId: PlastrongAccessoryId;
  priority: 1 | 2 | 3 | 4;
  slot: 'shell-identity' | 'limb-support' | 'ceremonial';
  overworldPresentation: AccessoryPresentation;
  reason: string;
}>;

export const PLASTRONG_ACCESSORY_PRIORITY_RULES = [
  {
    accessoryId: 'batch03.plastrong.boss-insignia',
    priority: 1,
    slot: 'shell-identity',
    overworldPresentation: 'full',
    reason: 'Boss identity must survive the 24×24 reduction.',
  },
  {
    accessoryId: 'batch03.plastrong.shell-mounted-belt',
    priority: 1,
    slot: 'shell-identity',
    overworldPresentation: 'simplified',
    reason: 'Keep a one-pixel shell band without crossing the hip openings.',
  },
  {
    accessoryId: 'batch03.plastrong.training-harness',
    priority: 2,
    slot: 'shell-identity',
    overworldPresentation: 'simplified',
    reason: 'Show the central mount only; straps require the menu frame or larger.',
  },
  {
    accessoryId: 'batch03.plastrong.forelimb-wraps',
    priority: 1,
    slot: 'limb-support',
    overworldPresentation: 'simplified',
    reason: 'One high-contrast limb pixel preserves joint and wrap readability.',
  },
  {
    accessoryId: 'batch03.plastrong.reinforced-knee-sleeves',
    priority: 2,
    slot: 'limb-support',
    overworldPresentation: 'simplified',
    reason: 'Keep one knee cue only when no higher-priority limb item is visible.',
  },
  {
    accessoryId: 'batch03.plastrong.victory-medal',
    priority: 2,
    slot: 'ceremonial',
    overworldPresentation: 'simplified',
    reason: 'Reduce to a single medal glint for victory presentation.',
  },
  {
    accessoryId: 'batch03.plastrong.champion-ribbon',
    priority: 3,
    slot: 'ceremonial',
    overworldPresentation: 'hidden',
    reason: 'Ribbon folds are not readable at 24×24 and can cover the shell edge.',
  },
  {
    accessoryId: 'batch03.plastrong.shell-chain',
    priority: 4,
    slot: 'ceremonial',
    overworldPresentation: 'hidden',
    reason: 'A chain cannot retain links or safe joint clearance at 24×24.',
  },
] as const satisfies readonly PlastrongAccessoryPriorityRule[];

export type ResolvedPlastrongAccessory = Readonly<{
  accessoryId: PlastrongAccessoryId;
  presentation: AccessoryPresentation;
  reason: string;
  anchor: Readonly<{ x: number; y: number }>;
}>;

const RULE_BY_ID = new Map(
  PLASTRONG_ACCESSORY_PRIORITY_RULES.map((rule) => [
    rule.accessoryId,
    rule,
  ]),
);

/**
 * Resolves visual-only accessory density. It never changes equipment bonuses,
 * saved cosmetic IDs, or the rigid shell geometry.
 */
export function resolvePlastrongAccessoryPriority(input: Readonly<{
  accessoryIds: readonly PlastrongAccessoryId[];
  context: BuddyPresentationContext;
  direction: BuddyFacingDirection;
}>): readonly ResolvedPlastrongAccessory[] {
  const uniqueIds = [
    ...new Set(
      input.accessoryIds.filter((id) =>
        PLASTRONG_ACCESSORY_IDS.includes(id),
      ),
    ),
  ];
  const ordered = uniqueIds
    .map((accessoryId) => RULE_BY_ID.get(accessoryId)!)
    .sort(
      (left, right) =>
        left.priority - right.priority ||
        left.accessoryId.localeCompare(right.accessoryId),
    );

  const occupiedSlots = new Set<string>();
  return ordered.map((rule) => {
    const mount = PLASTRONG_ACCESSORY_MOUNTS.find(
      (entry) =>
        entry.accessoryId === rule.accessoryId &&
        entry.direction === input.direction,
    )!;
    if (input.context !== 'overworld') {
      return {
        accessoryId: rule.accessoryId,
        presentation: 'full',
        reason: 'The authored 32px-or-larger profile has room for the full module.',
        anchor: mount.anchor,
      };
    }
    if (rule.overworldPresentation === 'hidden') {
      return {
        accessoryId: rule.accessoryId,
        presentation: 'hidden',
        reason: rule.reason,
        anchor: mount.anchor,
      };
    }
    const budgetSlot =
      rule.slot === 'shell-identity' ? 'shell-identity' : 'secondary';
    if (occupiedSlots.has(budgetSlot)) {
      return {
        accessoryId: rule.accessoryId,
        presentation: 'hidden',
        reason: `A higher-priority ${rule.slot} module already owns the 24×24 slot.`,
        anchor: mount.anchor,
      };
    }
    occupiedSlots.add(budgetSlot);
    return {
      accessoryId: rule.accessoryId,
      presentation: rule.overworldPresentation,
      reason: rule.reason,
      anchor: mount.anchor,
    };
  });
}

export function validatePlastrongAccessoryPriority(): readonly string[] {
  const errors: string[] = [];
  const ids = PLASTRONG_ACCESSORY_PRIORITY_RULES.map(
    (rule) => rule.accessoryId,
  );
  if (new Set(ids).size !== ids.length) {
    errors.push('Plastrong accessory-priority IDs must be unique.');
  }
  for (const accessoryId of PLASTRONG_ACCESSORY_IDS) {
    if (!RULE_BY_ID.has(accessoryId)) {
      errors.push(`Missing accessory-priority rule for "${accessoryId}".`);
    }
  }
  for (const direction of [
    'front',
    'back',
    'left',
    'right',
  ] as const) {
    const resolved = resolvePlastrongAccessoryPriority({
      accessoryIds: PLASTRONG_ACCESSORY_IDS,
      context: 'overworld',
      direction,
    });
    if (
      resolved.filter((entry) => entry.presentation !== 'hidden').length >
      2
    ) {
      errors.push(
        `Overworld ${direction} exceeds the two-module accessory budget.`,
      );
    }
  }
  return errors;
}
