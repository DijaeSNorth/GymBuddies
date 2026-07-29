export const AUTOSAVE_MIN_INTERVAL_MS = 5_000;

export function hasOnlyAllowedTopLevelChanges<T extends object>(
  previous: T,
  next: T,
  allowedKeys: readonly (keyof T)[],
) {
  const allowed = new Set<keyof T>(allowedKeys);
  let foundChange = false;
  for (const key of Object.keys(next) as Array<keyof T>) {
    if (Object.is(previous[key], next[key])) continue;
    if (!allowed.has(key)) return false;
    foundChange = true;
  }
  return foundChange;
}

export function getAutosaveDelayMs(
  lastPersistedAtMs: number,
  nowMs: number,
  minimumIntervalMs = AUTOSAVE_MIN_INTERVAL_MS,
) {
  const interval = Math.max(0, minimumIntervalMs);
  const elapsed = Math.max(0, nowMs - Math.max(0, lastPersistedAtMs));
  return Math.max(0, interval - elapsed);
}
