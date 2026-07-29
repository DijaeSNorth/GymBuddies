import { describe, expect, it } from 'vitest';

import { GYM_DEFINITIONS } from '../game/content/gyms';
import { ALL_TRAINING_MACHINES } from '../game/content/machines';
import {
  calculateMachineRepeatEfficiency,
} from '../game/systems/workoutResolution';
import { simulateWorkoutBalance } from '../game/systems/workoutBalanceSimulation';

describe('24-machine configuration', () => {
  it('assigns exactly four complete machine definitions to every gym', () => {
    expect(ALL_TRAINING_MACHINES).toHaveLength(24);
    GYM_DEFINITIONS.forEach((gym) => {
      const machines = ALL_TRAINING_MACHINES.filter(
        (machine) => machine.gymId === gym.id,
      );
      expect(machines, gym.name).toHaveLength(4);
      expect(machines.map((machine) => machine.id)).toEqual(gym.machineIds);
    });

    ALL_TRAINING_MACHINES.forEach((machine) => {
      expect(machine.id).toMatch(/^[a-z0-9_]+$/);
      expect(machine.visualConcept.length).toBeGreaterThan(20);
      expect(machine.primaryMuscleGroups.length).toBeGreaterThan(0);
      expect(machine.buddyDisciplines.length).toBeGreaterThan(0);
      expect(machine.rewardTable.id).toContain(machine.id.replaceAll('_', '-'));
      expect(machine.rewardTable.buddyXp.min).toBeGreaterThan(0);
      expect(machine.rewardTable.buddyXp.max).toBeGreaterThanOrEqual(
        machine.rewardTable.buddyXp.min,
      );
      expect(machine.hpEffect).toBeGreaterThanOrEqual(-8);
      expect(machine.fatigueCost).toBeGreaterThanOrEqual(0);
      expect(machine.difficulty).toBeGreaterThanOrEqual(1);
      expect(machine.difficulty).toBeLessThanOrEqual(5);
      expect(machine.dropProbabilities.boostToken).toBeLessThanOrEqual(0.08);
      expect(machine.dropProbabilities.deloadToken).toBeLessThanOrEqual(0.06);
      expect(machine.recommendedTrainerLevel.max).toBeGreaterThanOrEqual(
        machine.recommendedTrainerLevel.min,
      );
      expect(machine.animationCueId).toMatch(/^machine\..+\.cycle$/);
      expect(machine.soundCueId).toBe('train');
    });
  });

  it('does not give one machine every best-in-gym economic trait', () => {
    GYM_DEFINITIONS.forEach((gym) => {
      const machines = ALL_TRAINING_MACHINES.filter(
        (machine) => machine.gymId === gym.id,
      );
      const leaders = [
        Math.max(...machines.map((machine) => machine.rewardTable.buddyXp.max)),
        Math.max(...machines.map((machine) => machine.hpEffect)),
        Math.max(...machines.map((machine) => machine.momentumEffect)),
        Math.min(...machines.map((machine) => machine.fatigueCost)),
      ];
      const dominatesEveryTrait = machines.some(
        (machine) =>
          machine.rewardTable.buddyXp.max === leaders[0] &&
          machine.hpEffect === leaders[1] &&
          machine.momentumEffect === leaders[2] &&
          machine.fatigueCost === leaders[3],
      );
      expect(dominatesEveryTrait, gym.name).toBe(false);
    });
  });

  it('applies deterministic diminishing returns after each machine soft cap', () => {
    const machine = ALL_TRAINING_MACHINES.find(
      (entry) => entry.id === 'glory_deadlift',
    )!;

    expect(calculateMachineRepeatEfficiency(machine, 0)).toBe(1);
    expect(calculateMachineRepeatEfficiency(machine, machine.repeatSoftCap - 1)).toBe(1);
    expect(calculateMachineRepeatEfficiency(machine, machine.repeatSoftCap)).toBeCloseTo(0.88);
    expect(calculateMachineRepeatEfficiency(machine, machine.repeatSoftCap + 1)).toBeCloseTo(0.76);
    expect(calculateMachineRepeatEfficiency(machine, 99)).toBe(0.55);
  });
});

describe('workout balance simulation', () => {
  it('runs more than 10,000 seeded sessions with no final blocking outliers', () => {
    const result = simulateWorkoutBalance({
      seed: 20_260_728,
      sessionsPerMachine: 450,
    });

    expect(result.totalSessions).toBe(10_800);
    expect(result.machines).toHaveLength(24);
    expect(result.outliers).toEqual([]);
    result.machines.forEach((machine) => {
      expect(
        machine.successRate + machine.rescueRate + machine.failureRate,
      ).toBeCloseTo(1, 8);
      expect(machine.sessions).toBe(450);
      expect(machine.averageRewardEfficiency).toBeGreaterThanOrEqual(0.55);
      expect(Number.isFinite(machine.valueScore)).toBe(true);
    });
  });

  it('replays the same population exactly from the same seed', () => {
    const first = simulateWorkoutBalance({
      seed: 4_242,
      sessionsPerMachine: 12,
    });
    const replay = simulateWorkoutBalance({
      seed: 4_242,
      sessionsPerMachine: 12,
    });

    expect(first).toEqual(replay);
  });
});
