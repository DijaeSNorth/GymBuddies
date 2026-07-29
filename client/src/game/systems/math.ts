export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function clamp01(value: number) {
  return clamp(value, 0, 1);
}
