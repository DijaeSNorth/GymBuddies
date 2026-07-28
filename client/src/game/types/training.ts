export type GymKind = 'home' | 'starter' | 'higher';

export type WorkoutLoadTier = 'easy' | 'steady' | 'hard' | 'max';

export type WorkoutLoadDefinition = {
  id: WorkoutLoadTier;
  minimumPressure: number;
  deloadTokens: number;
};

export type GymMachine = {
  id: string;
  name: string;
  detail: string;
  focus: string;
  xpMin: number;
  xpMax: number;
  xpMultiplier: number;
  steroidChance: number;
  hpRestore: number;
  fatigueCost: number;
};

export type TrainingPhase = 'running' | 'spot' | 'resolved';

export type WorkoutSession = {
  id: number;
  phase: TrainingPhase;
  zoneType: GymKind;
  buddyId: string;
  machineId: string;
  willFail: boolean;
  startedAt: number;
  durationMs: number;
  failCheckAt: number;
  spotWindowMs: number;
  spotWindowStart: number;
  spotWindowEnd: number;
  failChance: number;
  buddyLevelBefore: number;
  hpLossOnFail: number;
  staminaChange: number;
  xpGain: number;
  steroidsAwarded: boolean;
  resolved: boolean;
  spotChanceBase: number;
  readiness: number;
  readinessLabel: string;
  loadPressure: number;
  loadTier: WorkoutLoadTier;
  setStress: number;
  movementConsistency: number;
  volumePreparedness: number;
  sessionQuality: number;
};
