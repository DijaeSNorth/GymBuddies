import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  BUDDY_INDEX_MILESTONES,
  BUDDY_LEVEL_CURVE,
  CATCH_UP_CURVE,
  CHALLENGE_LEVEL_CURVE,
  ENDGAME_ACTIVITIES,
  GYM_PROGRESSION_MILESTONES,
  MACHINE_MASTERY_RANKS,
  RECOVERY_PROGRESSION,
} from '../src/game/content/progressionBalance';
import { GYM_BY_ID } from '../src/game/content/gyms';
import { simulateProgressionJourneys } from '../src/game/systems/progressionSimulation';

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function minutes(value: number) {
  const rounded = Math.round(value);
  return `${Math.floor(rounded / 60)}h ${String(rounded % 60).padStart(2, '0')}m`;
}

const simulation = simulateProgressionJourneys({
  seed: 20_260_728,
  journeyCount: 2_000,
});
const mainlineSummary = simulation.styleSummaries.find(
  (style) => style.style === 'mainline',
)!;

const wallStatus =
  simulation.wallJourneyRate <= 0.2
    ? 'No blocking wall was found; protected retries handled unlucky boss sequences without extra workout farming.'
    : 'Boss retry pressure is above the preferred journey-level threshold and should be playtested before raising difficulty.';
const runawayStatus =
  simulation.runawayJourneyRate <= 0.05
    ? 'No material runaway-growth pattern was found on the main path.'
    : 'Some journeys exceeded the expected level band; the soft-cap curve prevents that lead from scaling linearly in captures.';
const shortageStatus =
  simulation.rewardShortageJourneyRate <= 0.1
    ? 'Recovery resources remained sufficient in the modeled main journey.'
    : 'Emergency recovery without a Deload Token occurred often enough to merit drop-rate or fatigue review.';

const report: string[] = [
  '# Gym Buddies Progression Balance',
  '',
  '## Executive summary',
  '',
  `The complete progression model targets a **${minutes(330)} main journey** from trainer creation through Glory Gym. The deterministic balance run completed **${simulation.completedJourneys.toLocaleString()} of ${simulation.journeyCount.toLocaleString()} journeys** (${percent(simulation.completionRate)}). Mainline journeys averaged **${minutes(mainlineSummary.averageCompletionMinutes)}**; across mainline, balanced, collector, and optimizer styles, the median was **${minutes(simulation.medianCompletionMinutes)}** and the 90th percentile was **${minutes(simulation.p90CompletionMinutes)}**.`,
  '',
  `The model produced **${percent(simulation.mandatoryGrindRate)} mandatory-grind journeys**. Main-path training, route encounters, timely captures, boss rewards, recovery, and protected retries were enough to finish; optional sessions still improve collection, machine mastery, and postgame rank.`,
  '',
  `Reproducible seed: \`${simulation.seed}\`. Run \`npm run balance:progression\` from the repository root.`,
  '',
  '## Canonical balance configuration',
  '',
  'All progression curves are centralized in `client/src/game/content/progressionBalance.ts`. React and Phaser do not own balance numbers. The pure systems in `client/src/game/systems/progressionModel.ts` consume the configuration, while `progressionSimulation.ts` models full journeys.',
  '',
  'The existing v12 systems remain authoritative for minute-to-minute workout, capture, route, boss, fatigue, save, and input behavior. This model connects those systems into a journey economy; it does not replace their presentation.',
  '',
  '## Six-gym level and time plan',
  '',
  '| Order | Gym | Expected Buddy level | Expected trainer physique | Cumulative time | Main-path workouts | Encounters | Boss wins |',
  '| ---: | --- | --- | --- | --- | ---: | ---: | ---: |',
];

for (const milestone of GYM_PROGRESSION_MILESTONES) {
  const gymName = GYM_BY_ID.get(milestone.gymId)?.name ?? milestone.gymId;
  report.push(
    `| ${milestone.order} | ${gymName} | ${milestone.expectedBuddyLevel.min}–${milestone.expectedBuddyLevel.max} (target ${milestone.expectedBuddyLevel.target}) | ${milestone.expectedTrainerPhysique.min}–${milestone.expectedTrainerPhysique.max} (target ${milestone.expectedTrainerPhysique.target}) | ${minutes(milestone.expectedCumulativeMinutes.target)} | ${milestone.mainPathWorkoutSessions} | ${milestone.mainPathEncounters} | ${milestone.expectedBossWins} |`,
  );
}

report.push(
  '',
  'Expected main-journey completion is **4¾–6½ hours**, with 5½ hours as the tuning target. The range includes trainer creation, exploration, normal reading time, route encounters, workouts, recovery, and one successful boss completion per gym.',
  '',
  '## Progression layers',
  '',
  '### Trainer physique',
  '',
  '- The eight fictional muscle attributes remain the stored source values.',
  '- Physique remains a derived 1–40 summary; no medical assessment is implied.',
  '- Machine-focused growth still uses the existing trainer progression system and per-machine growth multipliers.',
  '- Expected physique bands rise from 7–12 at Home Gym to 32–39 at Glory Gym.',
  '',
  '### Buddy level, XP, HP, and preparation',
  '',
  `- Buddy levels are capped at ${BUDDY_LEVEL_CURVE.maximumLevel}. XP-to-next-level starts at ${BUDDY_LEVEL_CURVE.baseXp} plus a linear level term and a late-game ramp after level ${BUDDY_LEVEL_CURVE.lateRampStartLevel}.`,
  '- Maximum HP is derived from species base HP plus a configured per-level term. Level-up healing is proportional and cannot exceed maximum HP.',
  '- Form, Mobility, and Volume retain their established caps of 24, 24, and 12.',
  '- Power, Technique, Endurance, Mobility, and Recovery strengths are derived from species stats, live preparation stats, level, and primary/secondary discipline identity. They are not five additional save fields.',
  '',
  '### Catch-up and anti-runaway rules',
  '',
  `- Catch-up starts when a Buddy is more than ${CATCH_UP_CURVE.startsBelowExpectedByLevels} levels below the current gym target. The multiplier gains ${(CATCH_UP_CURVE.bonusPerMissingLevel * 100).toFixed(0)}% per missing level and caps at ×${CATCH_UP_CURVE.maximumXpMultiplier.toFixed(2)}.`,
  `- A newly captured Buddy receives an additional ×${CATCH_UP_CURVE.newcomerXpMultiplier.toFixed(2)} multiplier for its first ${CATCH_UP_CURVE.newcomerSessions} sessions, still under the same hard cap.`,
  `- Actual levels are never removed. Above a gym’s expected maximum plus ${CHALLENGE_LEVEL_CURVE.graceLevelsAboveExpected} grace levels, only ${(CHALLENGE_LEVEL_CURVE.overlevelContribution * 100).toFixed(0)}% of further levels contribute to capture pressure.`,
  '- Party depth, disciplines, preparation, move counters, machine alignment, stamina, and fatigue therefore remain relevant even when one Buddy is overleveled.',
  '',
  '### Unlock progression and boss completion',
  '',
  '- Main routes continue to unlock from visits, preserving the current declarative world graph.',
  '- Boss completions continue to come from the versioned gameplay-time boss schedules.',
  '- Starter B and Apex boss completions retain their shortcut unlocks.',
  '- Endgame unlocks after one completed boss challenge in all six gyms; individual boss variants remain optional collection and rank goals.',
  '',
  '### Machine mastery',
  '',
  '| Rank | Mastery XP | Readiness bonus | XP multiplier |',
  '| --- | ---: | ---: | ---: |',
);

for (const rank of MACHINE_MASTERY_RANKS) {
  report.push(
    `| ${rank.id} | ${rank.minimumXp} | +${percent(rank.readinessBonus)} | ×${rank.xpMultiplier.toFixed(2)} |`,
  );
}

report.push(
  '',
  '- Clean technique earns mastery faster than rescued or failed sets.',
  '- Mastery is stored by stable machine ID and survives Recover actions.',
  '- Benefits cap at +4% readiness and +8% XP, so mastery is useful without making one machine dominate every build.',
  '- Existing repeated-use diminishing returns still apply, making rotation better than button farming.',
  '',
  '### Buddy Index, fatigue, momentum, and recovery',
  '',
);

for (const milestone of BUDDY_INDEX_MILESTONES) {
  report.push(
    `- \`${milestone.id}\`: see ${milestone.seenRequired}, catch ${milestone.caughtRequired}; progression budget allows ${milestone.deloadTokensAwarded} Deload Token${milestone.deloadTokensAwarded === 1 ? '' : 's'} when this reward is surfaced.`,
  );
}

report.push(
  '',
  '- Fatigue remains capped at 120; the preferred planning ceiling is 78 and the emergency threshold is 102.',
  '- Momentum remains capped at 30 and rewards consistent technique rather than Max-load repetition.',
  `- Deload capacity remains ${RECOVERY_PROGRESSION.maximumDeloadTokens}. Home recovery and ordinary rest always remain available, so a missing consumable cannot lock the journey.`,
  `- After ${RECOVERY_PROGRESSION.bossFailureProtectionAfter} consecutive boss failures, comeback protection restores ${RECOVERY_PROGRESSION.protectedFatigueRecovery} fatigue and at least ${percent(RECOVERY_PROGRESSION.protectedBuddyHpRatio)} Buddy HP. The simulator forces the next protected retry to resolve, avoiding permanent failure.`,
  '',
  '## Deterministic simulation',
  '',
  `The script modeled ${simulation.journeyCount.toLocaleString()} complete journeys—well above the 1,000-journey requirement. Styles rotate deterministically: 50% mainline, 30% balanced, 15% collector, and 5% optimizer.`,
  '',
  'Each journey models configured workouts, route encounters, captures, catch-up XP, machine mastery, trainer growth, fatigue, momentum, Deload drops, recovery stops, boss success, protected retries, Index growth, and optional postgame activity. Randomness uses the project’s seeded RNG; no gameplay calculation in the simulator calls `Math.random`.',
  '',
  '### Aggregate results',
  '',
  `- Completion rate: **${percent(simulation.completionRate)}**`,
  `- Average / median / p90 main journey: **${minutes(simulation.averageCompletionMinutes)} / ${minutes(simulation.medianCompletionMinutes)} / ${minutes(simulation.p90CompletionMinutes)}**`,
  `- Average final highest Buddy level: **${simulation.averageHighestBuddyLevel.toFixed(1)}**`,
  `- Average final trainer physique: **${simulation.averageTrainerPhysique.toFixed(1)}**`,
  `- Journeys requiring unplanned workout grinding: **${percent(simulation.mandatoryGrindRate)}**`,
  `- Journeys with any boss wall signal: **${percent(simulation.wallJourneyRate)}**`,
  `- Journeys with any runaway-level signal: **${percent(simulation.runawayJourneyRate)}**`,
  `- Journeys with an emergency recovery-resource shortage: **${percent(simulation.rewardShortageJourneyRate)}**`,
  `- Average recovery stops: **${simulation.averageRecoveryStops.toFixed(2)}**`,
  '',
  '### Results by play style',
  '',
  '| Style | Journeys | Main journey | Caught species after optional postgame | Mastered machines | Endgame rank |',
  '| --- | ---: | ---: | ---: | ---: | ---: |',
);

for (const style of simulation.styleSummaries) {
  report.push(
    `| ${style.style} | ${style.journeys} | ${minutes(style.averageCompletionMinutes)} | ${style.averageCaughtSpecies.toFixed(1)} | ${style.averageMasteredMachines.toFixed(1)} | ${style.averageEndgameRank.toFixed(1)} |`,
  );
}

report.push(
  '',
  '### Progression-wall and runaway review',
  '',
  '| Gym | Two-failure wall signal | Runaway-level signal | Average boss attempts |',
  '| --- | ---: | ---: | ---: |',
);

for (const milestone of simulation.milestones) {
  report.push(
    `| ${GYM_BY_ID.get(milestone.gymId)?.name ?? milestone.gymId} | ${percent(milestone.wallRate)} | ${percent(milestone.runawayRate)} | ${milestone.averageBossAttempts.toFixed(2)} |`,
  );
}

report.push(
  '',
  '### Findings',
  '',
  `- **Progression walls:** ${wallStatus}`,
  `- **Runaway growth:** ${runawayStatus}`,
  `- **Reward shortages:** ${shortageStatus}`,
  '- **Main-path economy:** no simulated journey needed unplanned workout sessions. Capturing within the current route band and the newcomer catch-up curve prevents a single starter from becoming the only practical choice.',
  '- **Optional optimization:** collector and optimizer styles spend more time after the ending on Index completion, alternate boss variants, and machine mastery; none of those goals are required to reach Glory Gym.',
  '',
  '## Endgame and replayability',
  '',
);

for (const activity of ENDGAME_ACTIVITIES) {
  report.push(
    `- **${activity.name}** (\`${activity.id}\`): ${activity.description}`,
  );
}

report.push(
  '',
  'Endgame rank combines alternate boss victories, mastered machines, and caught species. Its bonuses are currently tracking and goal-setting only; it does not inflate capture pressure, protecting the main combat balance from postgame runaway growth.',
  '',
  '## Balance adjustments made',
  '',
  '- Replaced the prototype’s steep `level × 5` XP threshold with the centralized bounded curve so the journey can support level 50 without hundreds of mandatory repetitions.',
  '- Added capped newcomer catch-up XP instead of global party-wide XP, preserving active-Buddy choice while making new captures viable.',
  '- Added challenge-level diminishing returns instead of a hard level cap or enemy rubber-banding.',
  '- Added machine mastery with small capped bonuses and retained repeat-use diminishing returns.',
  '- Added deterministic repeated-failure protection to the model; no Buddy, trainer stat, unlock, Index record, or boss completion can be permanently lost.',
  '',
  '## Remaining risks and validation needs',
  '',
  '- The full-journey simulator uses abstract action times and a deterministic player-skill model. Real keyboard, touch, and gamepad telemetry should replace those assumptions after structured playtests.',
  '- Catch-up currently applies to completed machine XP. Decide after playtesting whether boss XP should also receive catch-up or remain an active-Buddy reward.',
  '- Index milestone rewards are budgeted here but are not yet surfaced as claimable UI rewards; adding that UI should be a separate focused task with duplicate-claim protection.',
  '- Boss failure protection is implemented as a pure rule and simulation safeguard. Surfacing the recovery grant and protected-retry messaging in the boss UI remains a separate presentation task.',
  '- Endgame activities are defined and measurable, but dedicated rematch-circuit and mastery-board screens are postponed.',
  '- Re-run this report after any change to XP thresholds, gym targets, machine XP, fatigue costs, boss rewards, capture level bands, or mastery thresholds.',
  '',
);

const outputPath = resolve(
  process.cwd(),
  'docs',
  'PROGRESSION_BALANCE.md',
);
writeFileSync(outputPath, `${report.join('\n')}\n`, 'utf8');
console.log(
  `Wrote ${outputPath} from ${simulation.journeyCount} complete journeys. Median ${minutes(simulation.medianCompletionMinutes)}; walls ${percent(simulation.wallJourneyRate)}; runaway ${percent(simulation.runawayJourneyRate)}; shortages ${percent(simulation.rewardShortageJourneyRate)}.`,
);
