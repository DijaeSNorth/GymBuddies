import { describe, expect, it } from 'vitest';

import {
  BUDDY_SPECIES,
  LEGACY_BUDDY_SPECIES_ID_MAP,
  getBuddySpeciesById,
  normalizeBuddyDexList,
  resolveBuddySpeciesIdentity,
} from '../game/content/buddies';
import { collectBuddyRosterValidationErrors } from '../game/content/buddyValidation';
import { TEAM_SIZE } from '../game/content/save';
import { BUDDY_DISCIPLINES } from '../game/types';

describe('Gym Buddy roster', () => {
  it('contains 12 standard and 4 exotic species with valid content', () => {
    expect(BUDDY_SPECIES).toHaveLength(16);
    expect(BUDDY_SPECIES.filter((species) => !species.isExotic)).toHaveLength(12);
    expect(BUDDY_SPECIES.filter((species) => species.isExotic)).toHaveLength(4);
    expect(collectBuddyRosterValidationErrors(BUDDY_SPECIES)).toEqual([]);
  });

  it('covers every training discipline with a primary gameplay role', () => {
    const primaryDisciplines = new Set(
      BUDDY_SPECIES.map((species) => species.primaryDiscipline),
    );

    BUDDY_DISCIPLINES.forEach((discipline) => {
      expect(primaryDisciplines.has(discipline), `Missing ${discipline}`).toBe(true);
    });
    BUDDY_SPECIES.forEach((species) => {
      expect(species.gameplayRole.length).toBeGreaterThan(20);
      expect([
        species.primaryDiscipline,
        species.secondaryDiscipline,
      ]).toContain(species.signatureMove.discipline);
    });
  });

  it('keeps every procedural silhouette and palette distinct', () => {
    const silhouettes = new Set(
      BUDDY_SPECIES.map((species) => species.sprite.join('/')),
    );
    const palettes = new Set(
      BUDDY_SPECIES.map((species) => Object.values(species.palette).join('/')),
    );

    expect(silhouettes.size).toBe(BUDDY_SPECIES.length);
    expect(palettes.size).toBe(BUDDY_SPECIES.length);
  });

  it('preserves the live species Power balance for migrated v12 entries', () => {
    const expectedPower = {
      'brawny-bear': 26,
      'titan-tortoise': 22,
      'iron-wolf': 24,
      'muscled-boar': 23,
      'ripped-rhino': 29,
      'boulder-bison': 27,
      'buff-otter': 21,
      'titan-gorilla': 30,
      prismantle: 34,
      vaultwyrm: 38,
      crownquill: 40,
      manyfold: 36,
    } as const;

    Object.entries(expectedPower).forEach(([speciesId, power]) => {
      expect(getBuddySpeciesById(speciesId).power).toBe(power);
    });
  });

  it('resolves prior v12 exotic IDs and the legacy Titan Gorilla Index number', () => {
    Object.entries(LEGACY_BUDDY_SPECIES_ID_MAP).forEach(
      ([legacyId, canonicalId]) => {
        expect(getBuddySpeciesById(legacyId).id).toBe(canonicalId);
        expect(
          resolveBuddySpeciesIdentity({
            id: legacyId,
            dex: getBuddySpeciesById(canonicalId).dex,
          }).id,
        ).toBe(canonicalId);
      },
    );

    expect(normalizeBuddyDexList([1, 54, 8, 54])).toEqual([1, 8]);
    expect(resolveBuddySpeciesIdentity({ id: 'titan-gorilla', dex: 54 }).dex).toBe(8);
  });

  it('does not trust nested render fields from unknown stored species', () => {
    const fallback = BUDDY_SPECIES[0];
    const recovered = resolveBuddySpeciesIdentity({
      dex: 999,
      name: 'Archive Friend',
      palette: null,
      sprite: {},
      animations: null,
    } as unknown as Parameters<typeof resolveBuddySpeciesIdentity>[0]);

    expect(recovered.name).toBe('Archive Friend');
    expect(recovered.palette).toEqual(fallback.palette);
    expect(recovered.sprite).toEqual(fallback.sprite);
    expect(recovered.animations.idle).toBe(
      'buddy.legacy-dex-999.idle',
    );
  });

  it('detects duplicate IDs and malformed sprite references', () => {
    const invalidRoster = BUDDY_SPECIES.map((species, index) =>
      index === 1
        ? {
            ...species,
            id: BUDDY_SPECIES[0].id,
            sprite: BUDDY_SPECIES[0].sprite,
            animations: {
              ...species.animations,
              idle: 'invalid animation key',
            },
          }
        : species,
    );
    const errors = collectBuddyRosterValidationErrors(invalidRoster);

    expect(errors.some((error) => error.includes('duplicate species ID'))).toBe(true);
    expect(errors.some((error) => error.includes('duplicate sprite silhouette'))).toBe(true);
    expect(errors.some((error) => error.includes('invalid idle animation reference'))).toBe(true);
  });

  it('keeps the party limit at six', () => {
    expect(TEAM_SIZE).toBe(6);
  });
});
