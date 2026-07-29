export type RandomState = number;

export type RandomResult<T> = {
  value: T;
  randomState: RandomState;
};

let runtimeSeedCounter = 0;

/** Input: any numeric seed. Output: a serializable unsigned 32-bit RNG state. */
export function createRandomState(seed: number): RandomState {
  return Number.isFinite(seed) ? seed >>> 0 : 0;
}

/** Input: a random state. Output: a [0, 1) value and the next state without mutating the input. */
export function nextRandom(randomState: RandomState): RandomResult<number> {
  const nextState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0;
  return {
    value: nextState / 4_294_967_296,
    randomState: nextState,
  };
}

/** Input: inclusive integer bounds and RNG state. Output: an integer and the next state. */
export function randomInt(
  randomState: RandomState,
  minimum: number,
  maximum: number,
): RandomResult<number> {
  const step = nextRandom(randomState);
  return {
    value: Math.floor(step.value * (maximum - minimum + 1)) + minimum,
    randomState: step.randomState,
  };
}

/** Input: a non-empty list and RNG state. Output: a selected item and the next state. */
export function randomChoice<T>(
  randomState: RandomState,
  items: readonly T[],
): RandomResult<T> {
  if (items.length === 0) {
    throw new Error('Cannot choose from an empty list.');
  }
  const index = randomInt(randomState, 0, items.length - 1);
  return {
    value: items[index.value]!,
    randomState: index.randomState,
  };
}

/** Input: a probability and RNG state. Output: the roll result and the next state. */
export function rollChance(
  randomState: RandomState,
  chance: number,
): RandomResult<boolean> {
  const step = nextRandom(randomState);
  return {
    value: step.value < chance,
    randomState: step.randomState,
  };
}

/** Creates a runtime seed from platform entropy. Tests should pass a fixed seed instead. */
export function createRuntimeSeed(now = Date.now()): RandomState {
  runtimeSeedCounter = (runtimeSeedCounter + 1) >>> 0;
  let entropy = 0;
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    entropy = values[0] ?? 0;
  }
  return createRandomState(entropy ^ (now >>> 0) ^ Math.imul(runtimeSeedCounter, 2_654_435_761));
}
