import { describe, expect, it } from 'vitest';

import { TRAINER_BUILD_ATTRIBUTES } from '../game/content/trainerAppearance';
import {
  QUICK_FORGE_BUILD_IDS,
  QUICK_FORGE_GROUPS,
  TRAINER_BODY_REGIONS,
  TRAINER_STUDIO_SECTIONS,
} from '../ui/trainer/studio/studioConfig';

describe('single-page Trainer Forge information architecture', () => {
  it('keeps every existing body control reachable in Detail Forge', () => {
    const configured = new Set(
      TRAINER_BODY_REGIONS.flatMap((region) =>
        region.groups.flatMap((group) => group.attributeIds),
      ),
    );
    const authored = new Set(TRAINER_BUILD_ATTRIBUTES.map((attribute) => attribute.id));

    expect([...configured].sort()).toEqual([...authored].sort());
  });

  it('keeps contextual body groups short enough for a phone inspector', () => {
    for (const region of TRAINER_BODY_REGIONS) {
      for (const group of region.groups) {
        expect(group.attributeIds.length, group.id).toBeLessThanOrEqual(6);
        expect(new Set(group.attributeIds).size, group.id).toBe(group.attributeIds.length);
      }
    }
  });

  it('uses the focused ten-control Quick Forge and unique stable navigation IDs', () => {
    expect(QUICK_FORGE_BUILD_IDS).toHaveLength(10);
    expect(new Set(QUICK_FORGE_BUILD_IDS).size).toBe(10);
    expect(QUICK_FORGE_GROUPS.flatMap((group) => group.attributeIds)).toEqual(
      QUICK_FORGE_BUILD_IDS,
    );
    expect(
      Math.max(...QUICK_FORGE_GROUPS.map((group) => group.attributeIds.length)),
    ).toBeLessThanOrEqual(6);
    expect(new Set(TRAINER_BODY_REGIONS.map((region) => region.id)).size).toBe(
      TRAINER_BODY_REGIONS.length,
    );
    expect(new Set(TRAINER_STUDIO_SECTIONS.map((section) => section.id)).size).toBe(
      TRAINER_STUDIO_SECTIONS.length,
    );
  });
});
