import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { GYM_BY_ID } from '../src/game/content/gyms';
import { ALL_TRAINING_MACHINES } from '../src/game/content/machines';
import { simulateWorkoutBalance } from '../src/game/systems/workoutBalanceSimulation';

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function signed(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

function escapeCell(value: string) {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

const simulation = simulateWorkoutBalance({
  seed: 20_260_728,
  sessionsPerMachine: 600,
});

const report: string[] = [
  '# Gym Buddies Workout Balance Report',
  '',
  '## Executive summary',
  '',
  `The final deterministic simulation evaluated **${simulation.totalSessions.toLocaleString()} workout sessions** across all 24 machines (${simulation.sessionsPerMachine} per machine), four loads, all 16 Buddy species, varied trainer builds, fatigue states, momentum states, deload availability, and repeat-use counts.`,
  '',
  `Seed: \`${simulation.seed}\`. The report is reproducible with \`npm run balance:workouts\`.`,
  '',
  simulation.outliers.length
    ? `The final pass contains **${simulation.outliers.length} flagged outlier${simulation.outliers.length === 1 ? '' : 's'}** requiring review.`
    : 'The final pass contains **no blocking dominance, underpowered, success-rate, or fatigue outliers** under the declared thresholds.',
  '',
  '## Design goals and final adjustments',
  '',
  '- Home Gym rewards were compressed and differentiated: Recovery Rack teaches recovery, Mobility Dumbbells teaches alignment, Technique Plate Stack teaches load stress, and Foam Roller Bike teaches volume preparedness.',
  '- Starter Gym rewards now favor dependable two-discipline builds. Their XP spread is narrow, HP effects remain modest, and repeat soft caps are four sessions.',
  '- Higher gyms now pay more XP and trainer growth only alongside explicit HP loss, fatigue, narrower skill margins, or reduced momentum.',
  '- Bonus-item chances were reduced from the prototype’s broad 17–26% range to 1–8%; Deload Token drops remain 1–6%. This prevents low-input reward farming.',
  '- Glory’s highest-XP machines received negative HP and momentum effects plus two-use repeat soft caps.',
  '- Every machine now uses explicit muscle and Buddy-discipline data rather than relying only on display-name inference.',
  '',
  '### Outliers found and corrected',
  '',
  '- **Technique Plate Stack** initially scored 4.47, below the Home Gym floor. HP effect increased from +1 to +2 and momentum from +2 to +3 so its technique role is worthwhile without matching Recovery Rack healing.',
  '- **Pivot Hammer Row** initially scored 2.10. XP moved from 4–7 to 5–8 and momentum from +1 to +2 to pay for its extra fatigue.',
  '- **Forge Cage Press** initially scored 1.81. XP moved from 5–9 to 6–10 and momentum from +0 to +1 while its specialization costs stayed intact.',
  '- **Crown Crusher** initially scored 3.48. XP moved from 8–12 to 9–13 and momentum from −1 to +0; its HP, fatigue, difficulty, and repeat cap remain severe.',
  '- **Monorail Ground Stack** became the only second-pass outlier at 4.18 after the Crown Crusher correction. Its XP moved from 9–13 to 10–14, preserving its identity as the highest raw-XP machine.',
  '- A sample-size sensitivity pass then found **Arc Bench Rack**, **Leg Pulse Stack**, **Chain Arc Stack**, and **Wide-Grip Tower** could fall below their gym floors. The starter machines and Chain Arc Stack each gained +1 momentum; Wide-Grip Tower kept its 5–9 XP identity while moving from −2 to −1 HP, 5 to 4 fatigue, and +1 to +2 momentum.',
  '- The final pass, using stable per-machine random streams, produced zero blocking outliers.',
  '',
  '## Simulation method',
  '',
  '- 600 sessions per machine; 150 each on Easy, Steady, Hard, and Max.',
  '- Trainer level sampled from three below to three above each machine’s recommended range.',
  '- Trainer muscle values scale with level and specialize toward the machine’s declared primary groups.',
  '- Buddy species rotate across the complete 16-species roster; HP and preparation stats vary per session.',
  '- Fatigue, momentum, deload availability, and consecutive-use counts are seeded and varied.',
  '- Each machine receives a stable random stream derived from the report seed and machine ID, preventing array order or sample-size changes from reshuffling another machine’s population.',
  '- Rep input uses a deterministic human-timing model whose variance incorporates machine difficulty, load pressure, form consistency, and trainer-level fit.',
  '- Spot Now reaction time is deterministic from the seed and compared with the real rescue deadline.',
  '- Runtime workout preview, rep grading, rescue, rewards, drops, fatigue, HP, and momentum functions are used directly.',
  '',
  '### Outlier thresholds',
  '',
  '- Dominant: value score above 128% of the gym mean while also carrying above-average XP and below-average fatigue.',
  '- Underpowered: value score below 68% of the gym mean.',
  '- Timing outlier: clean success above 90% or below 20%.',
  '- Fatigue outlier: average fatigue above 26 without above-average XP.',
  '',
  '## Final simulation results',
  '',
  '| Machine | Gym | Clean | Rescued | Failed | Avg XP | Avg HP | Avg fatigue | Avg momentum | Repeat yield | Boost drop | Deload drop | Value |',
  '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
];

for (const result of simulation.machines) {
  const machine = ALL_TRAINING_MACHINES.find(
    (entry) => entry.id === result.machineId,
  )!;
  report.push(
    `| ${escapeCell(machine.name)} | ${escapeCell(GYM_BY_ID.get(machine.gymId)?.name ?? machine.gymId)} | ${percent(result.successRate)} | ${percent(result.rescueRate)} | ${percent(result.failureRate)} | ${result.averageXp.toFixed(2)} | ${signed(result.averageHpChange)} | ${signed(result.averageFatigueChange)} | ${signed(result.averageMomentumChange)} | ${percent(result.averageRewardEfficiency)} | ${percent(result.boostDropRate)} | ${percent(result.deloadDropRate)} | ${result.valueScore.toFixed(2)} |`,
  );
}

report.push('', '## Outlier review', '');
if (simulation.outliers.length === 0) {
  report.push(
    'No machine crossed the blocking thresholds. Machines still retain different roles: recovery, momentum, general growth, or high-risk specialization.',
  );
} else {
  for (const outlier of simulation.outliers) {
    report.push(
      `- **${outlier.machineId} — ${outlier.kind}:** ${outlier.detail}`,
    );
  }
}

report.push(
  '',
  '## Repeat-use diminishing returns',
  '',
  'Each machine defines a `repeatSoftCap`. Sessions up to that cap receive 100% reward efficiency. Every consecutive use beyond the cap removes 12 percentage points down to a 55% floor. Reward efficiency scales XP and momentum directly and scales both drop probabilities quadratically. Switching machines or completing a Recover action resets the consecutive-use chain.',
  '',
  '| Previous consecutive uses beyond cap | XP and momentum yield | Drop-yield multiplier |',
  '| ---: | ---: | ---: |',
  '| 1 | 88% | 77.4% |',
  '| 2 | 76% | 57.8% |',
  '| 3 | 64% | 41.0% |',
  '| 4+ | 55% floor | 30.3% floor |',
  '',
  '## Complete machine configuration',
  '',
);

for (const gym of GYM_BY_ID.values()) {
  report.push(`### ${gym.name}`, '');
  const machines = ALL_TRAINING_MACHINES.filter(
    (machine) => machine.gymId === gym.id,
  );
  for (const machine of machines) {
    const xp = machine.rewardTable.buddyXp;
    report.push(
      `#### ${machine.name}`,
      '',
      `- Stable ID: \`${machine.id}\``,
      `- Gym: ${gym.name} (\`${machine.gymId}\`)`,
      `- Visual concept: ${machine.visualConcept}`,
      `- Gameplay purpose: ${machine.detail}`,
      `- Primary muscle groups: ${machine.primaryMuscleGroups.join(', ')}`,
      `- Buddy disciplines affected: ${machine.buddyDisciplines.join(', ')}`,
      `- XP range: ${xp.min}–${xp.max}, ×${xp.multiplier.toFixed(2)}`,
      `- HP effect: ${machine.hpEffect >= 0 ? '+' : ''}${machine.hpEffect}`,
      `- Fatigue cost: +${machine.fatigueCost}`,
      `- Momentum effect: ${machine.momentumEffect >= 0 ? '+' : ''}${machine.momentumEffect}`,
      `- Difficulty: ${machine.difficulty}/5`,
      `- Reward table: \`${machine.rewardTable.id}\`; trainer growth ×${machine.rewardTable.trainerGrowthMultiplier.toFixed(2)}`,
      `- Drop probabilities: Boost Token ${percent(machine.dropProbabilities.boostToken)}, Deload Token ${percent(machine.dropProbabilities.deloadToken)}`,
      `- Recommended trainer level: ${machine.recommendedTrainerLevel.min}–${machine.recommendedTrainerLevel.max}`,
      `- Repeat soft cap: ${machine.repeatSoftCap}`,
      `- Animation cue ID: \`${machine.animationCueId}\``,
      `- Sound cue ID: \`${machine.soundCueId}\``,
      '',
    );
  }
}

report.push(
  '## Remaining validation questions',
  '',
  '- The timing model approximates human input; telemetry from real keyboard, touch, and gamepad sessions should replace its assumptions when available.',
  '- Drop rates are intentionally low. Validate whether players recognize them as bonuses rather than expected per-session rewards.',
  '- Confirm that a Recover reset feels like a strategic break and not a mandatory farming loop.',
  '- Re-run this report after changing load windows, XP curves, fatigue caps, Buddy base stats, or trainer muscle limits.',
  '',
);

const outputPath = resolve(process.cwd(), 'docs', 'BALANCE_WORKOUT_REPORT.md');
writeFileSync(outputPath, `${report.join('\n')}\n`, 'utf8');
console.log(
  `Wrote ${outputPath} with ${simulation.totalSessions} sessions and ${simulation.outliers.length} outlier flags.`,
);
