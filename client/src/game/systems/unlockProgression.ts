/** Input: candidate IDs and world content. Output: unique, valid, serializable zone IDs. */
export function normalizeUnlockedZones(input: {
  raw?: readonly string[];
  fallback: readonly string[];
  validZoneIds: readonly string[];
  startingZoneId: string;
}) {
  const validZones = new Set(input.validZoneIds);
  const normalized = [...new Set([...input.fallback, ...(input.raw ?? [])])].filter(
    (zoneId) => validZones.has(zoneId),
  );
  return normalized.length > 0 ? normalized : [input.startingZoneId];
}

/** Input: known zones, current zone, and route graph. Output: newly unlocked valid zones. */
export function unlockAdjacentZones(input: {
  known: readonly string[];
  zoneId: string;
  routes: Readonly<Record<string, readonly string[]>>;
  fallback: readonly string[];
  validZoneIds: readonly string[];
  startingZoneId: string;
}) {
  return normalizeUnlockedZones({
    raw: [
      ...input.known,
      input.zoneId,
      ...(input.routes[input.zoneId] ?? []),
    ],
    fallback: input.fallback,
    validZoneIds: input.validZoneIds,
    startingZoneId: input.startingZoneId,
  });
}

export function appendUniqueNumber(values: readonly number[], value: number) {
  return values.includes(value) ? [...values] : [...values, value];
}
