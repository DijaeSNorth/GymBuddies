import type { BuddyDiscipline } from './buddy';
import type { GymZoneId } from './overworld';

export type ProgressionRange = {
  min: number;
  target: number;
  max: number;
};

export type GymProgressionMilestone = {
  id: string;
  gymId: GymZoneId;
  order: number;
  expectedBuddyLevel: ProgressionRange;
  expectedTrainerPhysique: ProgressionRange;
  expectedCumulativeMinutes: ProgressionRange;
  mainPathWorkoutSessions: number;
  mainPathEncounters: number;
  expectedBossWins: number;
};

export type MachineMasteryRankId =
  | 'new'
  | 'familiar'
  | 'skilled'
  | 'mastered';

export type MachineMasteryRank = {
  id: MachineMasteryRankId;
  minimumXp: number;
  readinessBonus: number;
  xpMultiplier: number;
};

export type MachineMasteryProgress = {
  xp: number;
  sessions: number;
  successfulSessions: number;
  bestQuality: number;
};

export type BuddyDisciplineStrengths = Record<BuddyDiscipline, number>;

export type BuddyIndexMilestone = {
  id: string;
  seenRequired: number;
  caughtRequired: number;
  deloadTokensAwarded: number;
};

export type EndgameActivityDefinition = {
  id: string;
  name: string;
  unlock: 'main-journey' | 'index' | 'mastery' | 'all-bosses';
  description: string;
};

export type EndgameProgress = {
  unlocked: boolean;
  rank: number;
  rankXp: number;
  completedGymCount: number;
  completedBossVariantCount: number;
  indexCaught: number;
  masteredMachineCount: number;
  availableActivityIds: string[];
};
