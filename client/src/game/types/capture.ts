import type { BuddySpecies } from './buddy';

export type CaptureMoveId = 'burst' | 'grind' | 'snap';

export type CaptureMove = {
  id: CaptureMoveId;
  title: string;
  tactic: string;
  power: number;
  control: number;
};

export type Encounter = {
  creature: BuddySpecies;
  level: number;
  zoneId: string;
  catchChance: number;
  isBoss: boolean;
  bossName?: string;
  bossPowerBonus?: number;
  bossChallengeMachineId?: string;
  bossChallengeMachineName?: string;
  bossChallengeTier?: BossChallengeTier;
};

export type Match = {
  encounter: Encounter;
  status: 'idle' | 'playing' | 'won' | 'escape' | 'failed' | 'full';
  round: number;
  maxRounds: number;
  meter: number;
  lines: string[];
  isBossChallengeActive: boolean;
  bossChallengeMachineId: string | null;
  bossChallengeMachineName: string | null;
  bossChallengeMisses: number;
  bossChallengeMatchStreak: number;
  bossChallengeNearMisses: number;
};

export type BossChallengeStress = {
  percent: number;
  tone: 'safe' | 'caution' | 'danger' | 'overload';
  label: string;
  detail: string;
};

export type BossChallengeTier = 'low' | 'normal' | 'high';

export type BossChallengeDifficultyProfile = {
  matchMachineBonus: number;
  focusMatchBonus: number;
  focusMismatchPenalty: number;
  maxRounds: number;
  streakLimit: number;
  missResetGrace: number;
};
