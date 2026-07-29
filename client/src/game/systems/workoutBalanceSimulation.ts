import { BUDDY_STAT_LIMITS, FATIGUE_BALANCE } from '../content/balance';
import { BUDDY_SPECIES } from '../content/buddies';
import { GYM_BY_ID } from '../content/gyms';
import { ALL_TRAINING_MACHINES } from '../content/machines';
import { MAX_MUSCLE_LEVEL } from '../content/trainer';
import {
  DEFAULT_TRAINER_APPEARANCE,
  cloneTrainerAppearance,
} from '../content/trainerAppearance';
import { WORKOUT_LOAD_ORDER } from '../content/workoutLoads';
import type {
  Buddy,
  GymMachine,
  TrainerMuscleId,
  TrainerProfile,
  WorkoutLoadTier,
  WorkoutOutcome,
  WorkoutSession,
} from '../types';
import { clamp } from './math';
import {
  createRandomState,
  nextRandom,
  randomInt,
  type RandomState,
} from './random';
import {
  calculateWorkoutPreview,
  calculateWorkoutResolution,
  createWorkoutSession,
  resolveWorkoutRep,
  resolveWorkoutSpot,
} from './workoutResolution';

export type WorkoutMachineSimulationResult = {
  machineId: string;
  gymId: string;
  sessions: number;
  successRate: number;
  rescueRate: number;
  failureRate: number;
  averageXp: number;
  averageHpChange: number;
  averageFatigueChange: number;
  averageMomentumChange: number;
  averageRewardEfficiency: number;
  boostDropRate: number;
  deloadDropRate: number;
  valueScore: number;
};

export type WorkoutBalanceOutlier = {
  machineId: string;
  kind:
    | 'dominant'
    | 'underpowered'
    | 'success-high'
    | 'success-low'
    | 'fatigue-high';
  detail: string;
};

export type WorkoutBalanceSimulationResult = {
  seed: number;
  sessionsPerMachine: number;
  totalSessions: number;
  machines: WorkoutMachineSimulationResult[];
  outliers: WorkoutBalanceOutlier[];
};

type MutableAggregate = {
  sessions: number;
  outcomes: Record<WorkoutOutcome, number>;
  xp: number;
  hp: number;
  fatigue: number;
  momentum: number;
  rewardEfficiency: number;
  boostDrops: number;
  deloadDrops: number;
};

function draw(randomState: RandomState) {
  return nextRandom(randomState);
}

function createMachineSimulationSeed(seed: number, machineId: string) {
  let hash = seed >>> 0;
  for (let index = 0; index < machineId.length; index += 1) {
    hash = Math.imul(hash ^ machineId.charCodeAt(index), 16_777_619) >>> 0;
  }
  return hash;
}

function gymKindForMachine(machine: GymMachine) {
  return GYM_BY_ID.get(machine.gymId)?.type ?? 'higher';
}

function createSimulationTrainer(
  machine: GymMachine,
  trainerLevel: number,
  randomState: RandomState,
) {
  let state = randomState;
  const muscles = {} as Record<TrainerMuscleId, number>;
  const allMuscles: TrainerMuscleId[] = [
    'shoulders',
    'chest',
    'arms',
    'triceps',
    'back',
    'core',
    'quads',
    'calves',
  ];
  const base = clamp(Math.round(2 + trainerLevel / 6), 1, MAX_MUSCLE_LEVEL);
  for (const muscle of allMuscles) {
    const roll = randomInt(state, -2, 2);
    state = roll.randomState;
    const specialization = machine.primaryMuscleGroups.includes(muscle) ? 2 : 0;
    muscles[muscle] = clamp(
      base + roll.value + specialization,
      1,
      MAX_MUSCLE_LEVEL,
    );
  }
  const trainer: TrainerProfile = {
    name: 'Simulation Trainer',
    appearance: cloneTrainerAppearance(DEFAULT_TRAINER_APPEARANCE),
    appearancePresets: [],
    skin: '#c98f65',
    hair: '#262626',
    top: '#2e66af',
    glove: '#f3c56b',
    shoes: '#252525',
    muscles,
  };
  return { trainer, randomState: state };
}

function createSimulationBuddy(
  machine: GymMachine,
  trainerLevel: number,
  sessionIndex: number,
  randomState: RandomState,
) {
  let state = randomState;
  const species = BUDDY_SPECIES[sessionIndex % BUDDY_SPECIES.length]!;
  const maxHp = 34 + trainerLevel * 4;
  const hpRatioRoll = draw(state);
  state = hpRatioRoll.randomState;
  const statNoise = randomInt(state, -2, 2);
  state = statNoise.randomState;
  const form = clamp(
    8 + Math.round(trainerLevel / 4) + statNoise.value,
    1,
    BUDDY_STAT_LIMITS.form,
  );
  const mobility = clamp(
    8 + Math.round(trainerLevel / 5) - statNoise.value,
    1,
    BUDDY_STAT_LIMITS.mobility,
  );
  const volume = clamp(
    3 + Math.round(trainerLevel / 7) + (machine.difficulty >= 4 ? 1 : 0),
    1,
    BUDDY_STAT_LIMITS.volume,
  );
  const buddy: Buddy = {
    id: `simulation-${machine.id}-${sessionIndex}`,
    nickname: 'Simulation Buddy',
    creature: species,
    level: trainerLevel,
    maxHp,
    hp: clamp(
      Math.round(maxHp * (0.62 + hpRatioRoll.value * 0.38)),
      1,
      maxHp,
    ),
    xp: 0,
    form,
    mobility,
    volume,
  };
  return { buddy, randomState: state };
}

function normalTimingNoise(randomState: RandomState, standardDeviation: number) {
  const first = draw(randomState);
  const second = draw(first.randomState);
  const safeFirst = Math.max(first.value, 0.000001);
  const standardNormal =
    Math.sqrt(-2 * Math.log(safeFirst)) * Math.cos(2 * Math.PI * second.value);
  return {
    value: standardNormal * standardDeviation,
    randomState: second.randomState,
  };
}

function simulateOneSession(input: {
  machine: GymMachine;
  load: WorkoutLoadTier;
  sessionIndex: number;
  randomState: RandomState;
}) {
  let state = input.randomState;
  const levelRoll = randomInt(
    state,
    Math.max(1, input.machine.recommendedTrainerLevel.min - 3),
    input.machine.recommendedTrainerLevel.max + 3,
  );
  state = levelRoll.randomState;
  const trainerResult = createSimulationTrainer(
    input.machine,
    levelRoll.value,
    state,
  );
  state = trainerResult.randomState;
  const buddyResult = createSimulationBuddy(
    input.machine,
    levelRoll.value,
    input.sessionIndex,
    state,
  );
  state = buddyResult.randomState;
  const fatigueRoll = randomInt(state, 0, FATIGUE_BALANCE.maximum);
  state = fatigueRoll.randomState;
  const momentumRoll = randomInt(state, 0, 30);
  state = momentumRoll.randomState;
  const deloadRoll = randomInt(state, 0, 4);
  state = deloadRoll.randomState;
  const repeatRoll = draw(state);
  state = repeatRoll.randomState;
  const consecutiveMachineUses = Math.floor(repeatRoll.value * repeatRoll.value * 8);
  const startedAt = 10_000 + input.sessionIndex * 100_000;
  const created = createWorkoutSession({
    buddy: buddyResult.buddy,
    machine: input.machine,
    trainer: trainerResult.trainer,
    gymKind: gymKindForMachine(input.machine),
    trainingFatigue: fatigueRoll.value,
    workoutMomentum: momentumRoll.value,
    deloadTokens: deloadRoll.value,
    consecutiveMachineUses,
    selectedLoad: input.load,
    startedAt,
    randomState: state,
  });
  state = created.randomState;
  let session: WorkoutSession = created.session;
  const levelFit = clamp(
    (levelRoll.value - input.machine.recommendedTrainerLevel.min + 4) /
      Math.max(
        8,
        input.machine.recommendedTrainerLevel.max -
          input.machine.recommendedTrainerLevel.min +
          8,
      ),
    0,
    1,
  );

  while (!session.resolved) {
    const preview = calculateWorkoutPreview({
      buddy: buddyResult.buddy,
      machine: input.machine,
      trainer: trainerResult.trainer,
      gymKind: gymKindForMachine(input.machine),
      selectedLoad: input.load,
      trainingFatigue: fatigueRoll.value,
      workoutMomentum: momentumRoll.value,
      deloadTokens: deloadRoll.value,
      consecutiveMachineUses,
    });
    const standardDeviation = clamp(
      0.055 +
        input.machine.difficulty * 0.009 +
        session.loadPressure * 0.035 +
        (1 - preview.formConsistency) * 0.07 -
        levelFit * 0.025,
      0.045,
      0.17,
    );
    const noise = normalTimingNoise(state, standardDeviation);
    state = noise.randomState;
    const timingPosition = clamp(
      session.timingTarget + noise.value,
      0,
      1,
    );
    session = resolveWorkoutRep(
      session,
      session.repStartedAt + session.repDurationMs * timingPosition,
    );
    if (session.phase === 'spot') {
      const reactionRoll = draw(state);
      state = reactionRoll.randomState;
      const reactionMs =
        220 +
        reactionRoll.value * 1_050 +
        input.machine.difficulty * 45 -
        levelFit * 180;
      session = resolveWorkoutSpot({
        session,
        inputAt: session.spotWindowStart + reactionMs,
      }).session;
    }
  }

  const resolution = calculateWorkoutResolution({
    session,
    buddy: buddyResult.buddy,
    machine: input.machine,
    trainer: trainerResult.trainer,
    steroids: 0,
    workoutMomentum: momentumRoll.value,
    trainingFatigue: fatigueRoll.value,
  });
  return {
    session,
    resolution,
    randomState: state,
  };
}

function detectOutliers(machines: WorkoutMachineSimulationResult[]) {
  const outliers: WorkoutBalanceOutlier[] = [];
  const gymIds = [...new Set(machines.map((machine) => machine.gymId))];
  for (const gymId of gymIds) {
    const gymMachines = machines.filter((machine) => machine.gymId === gymId);
    const averageValue =
      gymMachines.reduce((sum, machine) => sum + machine.valueScore, 0) /
      gymMachines.length;
    const averageXp =
      gymMachines.reduce((sum, machine) => sum + machine.averageXp, 0) /
      gymMachines.length;
    const averageFatigue =
      gymMachines.reduce(
        (sum, machine) => sum + machine.averageFatigueChange,
        0,
      ) / gymMachines.length;
    for (const machine of gymMachines) {
      if (
        machine.valueScore > averageValue * 1.28 &&
        machine.averageXp >= averageXp &&
        machine.averageFatigueChange <= averageFatigue
      ) {
        outliers.push({
          machineId: machine.machineId,
          kind: 'dominant',
          detail: `Value ${machine.valueScore.toFixed(2)} exceeds its gym mean ${averageValue.toFixed(2)} while retaining above-average XP and below-average fatigue.`,
        });
      }
      if (machine.valueScore < averageValue * 0.68) {
        outliers.push({
          machineId: machine.machineId,
          kind: 'underpowered',
          detail: `Value ${machine.valueScore.toFixed(2)} falls below 68% of its gym mean ${averageValue.toFixed(2)}.`,
        });
      }
      if (machine.successRate > 0.9) {
        outliers.push({
          machineId: machine.machineId,
          kind: 'success-high',
          detail: `Clean success rate ${(machine.successRate * 100).toFixed(1)}% leaves too little timing tension.`,
        });
      }
      if (machine.successRate < 0.2) {
        outliers.push({
          machineId: machine.machineId,
          kind: 'success-low',
          detail: `Clean success rate ${(machine.successRate * 100).toFixed(1)}% is below the 20% floor.`,
        });
      }
      if (
        machine.averageFatigueChange > 26 &&
        machine.averageXp < averageXp
      ) {
        outliers.push({
          machineId: machine.machineId,
          kind: 'fatigue-high',
          detail: `Average fatigue ${machine.averageFatigueChange.toFixed(2)} is high without above-average XP.`,
        });
      }
    }
  }
  return outliers;
}

/** Runs a deterministic mixed-load, mixed-build workout population simulation. */
export function simulateWorkoutBalance(input?: {
  seed?: number;
  sessionsPerMachine?: number;
}): WorkoutBalanceSimulationResult {
  const seed = input?.seed ?? 20_260_728;
  const sessionsPerMachine = Math.max(1, input?.sessionsPerMachine ?? 600);
  const machineResults: WorkoutMachineSimulationResult[] = [];

  for (const machine of ALL_TRAINING_MACHINES) {
    let randomState = createRandomState(
      createMachineSimulationSeed(seed, machine.id),
    );
    const aggregate: MutableAggregate = {
      sessions: 0,
      outcomes: { success: 0, rescued: 0, failure: 0 },
      xp: 0,
      hp: 0,
      fatigue: 0,
      momentum: 0,
      rewardEfficiency: 0,
      boostDrops: 0,
      deloadDrops: 0,
    };
    for (let index = 0; index < sessionsPerMachine; index += 1) {
      const result = simulateOneSession({
        machine,
        load: WORKOUT_LOAD_ORDER[index % WORKOUT_LOAD_ORDER.length],
        sessionIndex: index,
        randomState,
      });
      randomState = result.randomState;
      const outcome = result.resolution.outcome;
      aggregate.sessions += 1;
      aggregate.outcomes[outcome] += 1;
      aggregate.xp += result.resolution.xpAwarded;
      aggregate.hp += result.resolution.hpChange;
      aggregate.fatigue += result.resolution.fatigueDelta;
      aggregate.momentum += result.resolution.momentumDelta;
      aggregate.rewardEfficiency += result.session.rewardEfficiency;
      aggregate.boostDrops += result.resolution.steroidsAwarded;
      aggregate.deloadDrops += result.resolution.deloadTokensAwarded;
    }
    const sessions = aggregate.sessions;
    const averageXp = aggregate.xp / sessions;
    const averageHpChange = aggregate.hp / sessions;
    const averageFatigueChange = aggregate.fatigue / sessions;
    const averageMomentumChange = aggregate.momentum / sessions;
    const boostDropRate = aggregate.boostDrops / sessions;
    const deloadDropRate = aggregate.deloadDrops / sessions;
    const valueScore =
      averageXp +
      averageMomentumChange * 1.5 +
      boostDropRate * 12 +
      deloadDropRate * 10 +
      Math.max(0, averageHpChange) * 0.45 -
      Math.max(0, -averageHpChange) * 0.5 -
      Math.max(0, averageFatigueChange) * 0.32;
    machineResults.push({
      machineId: machine.id,
      gymId: machine.gymId,
      sessions,
      successRate: aggregate.outcomes.success / sessions,
      rescueRate: aggregate.outcomes.rescued / sessions,
      failureRate: aggregate.outcomes.failure / sessions,
      averageXp,
      averageHpChange,
      averageFatigueChange,
      averageMomentumChange,
      averageRewardEfficiency: aggregate.rewardEfficiency / sessions,
      boostDropRate,
      deloadDropRate,
      valueScore,
    });
  }

  return {
    seed,
    sessionsPerMachine,
    totalSessions: sessionsPerMachine * ALL_TRAINING_MACHINES.length,
    machines: machineResults,
    outliers: detectOutliers(machineResults),
  };
}
