import {
  WORLD_ROUTE_ENCOUNTER_RATE,
  WORLD_ROUTE_FATIGUE_BY_ZONETYPE,
  WORLD_ROUTE_PATH_MAP,
  getOrderedRouteKey,
} from '../content/routes';
import type {
  BuddySpecies,
  Encounter,
  GymArea,
  GymKind,
  WorldRouteConnection,
} from '../types';
import { FATIGUE_BALANCE } from '../content/balance';
import { clamp01 } from './math';
import {
  nextRandom,
  randomChoice,
  randomInt,
  type RandomState,
} from './random';

export function getBaseCatchChance(level: number, isExotic: boolean) {
  if (isExotic) return 0.4;
  if (level <= 15) return 0.9;
  if (level <= 25) return 0.85;
  if (level <= 35) return 0.8;
  return 0.7;
}

export function getRouteProfile(
  fromZoneId: string | null,
  toZoneId: string | null,
): WorldRouteConnection | null {
  if (!fromZoneId || !toZoneId || fromZoneId === toZoneId) return null;
  return (
    WORLD_ROUTE_PATH_MAP[getOrderedRouteKey(fromZoneId, toZoneId)] ?? null
  );
}

export function calculateRouteFatigueCost(
  fromZoneId: string | null,
  toZoneId: string | null,
  gymKind: GymKind,
) {
  return (
    getRouteProfile(fromZoneId, toZoneId)?.travelFatigue ??
    WORLD_ROUTE_FATIGUE_BY_ZONETYPE[gymKind]
  );
}

export function calculateRouteEncounterBoost(
  fromZoneId: string | null,
  toZoneId: string | null,
) {
  return getRouteProfile(fromZoneId, toZoneId)?.encounterBoost ?? 0;
}

/** Input: gym tier, route boost, and fatigue. Output: bounded route encounter probability. */
export function calculateRouteEncounterChance(input: {
  gymKind: GymKind;
  encounterBoost?: number;
  trainingFatigue?: number;
}) {
  const encounterBoost = input.encounterBoost ?? 0;
  const trainingFatigue = input.trainingFatigue ?? 0;
  const chance =
    WORLD_ROUTE_ENCOUNTER_RATE[input.gymKind] *
    (1 + encounterBoost) *
    (1 + clamp01(trainingFatigue / FATIGUE_BALANCE.maximum) * 0.2);
  return Math.min(0.55, chance);
}

/** Input: encounter probability and RNG state. Output: spawn decision and next RNG state. */
export function rollRouteEncounter(
  randomState: RandomState,
  encounterChance: number,
) {
  const roll = nextRandom(randomState);
  return {
    shouldSpawn: roll.value < encounterChance,
    randomState: roll.randomState,
  };
}

/** Input: gym, species catalog, and RNG state. Output: one wild encounter and next RNG state. */
export function createWildEncounter(input: {
  gym: GymArea;
  species: readonly BuddySpecies[];
  randomState: RandomState;
}) {
  const mythicChance =
    input.gym.type === 'higher' ? 0.22 : input.gym.type === 'starter' ? 0.1 : 0;
  let randomState = input.randomState;
  const pool: BuddySpecies[] = [];
  for (const species of input.species) {
    const mythicRoll = nextRandom(randomState);
    randomState = mythicRoll.randomState;
    if (species.isExotic === (mythicRoll.value < mythicChance)) {
      pool.push(species);
    }
  }
  const source =
    pool.length > 0
      ? pool
      : input.species.filter((species) => !species.isExotic);
  const speciesRoll = randomChoice(randomState, source);
  const levelRoll = randomInt(
    speciesRoll.randomState,
    input.gym.levelMin,
    input.gym.levelMax,
  );
  const encounter: Encounter = {
    creature: speciesRoll.value,
    level: levelRoll.value,
    zoneId: input.gym.id,
    catchChance: getBaseCatchChance(
      levelRoll.value,
      speciesRoll.value.isExotic,
    ),
    isBoss: false,
  };
  return {
    encounter,
    randomState: levelRoll.randomState,
  };
}
