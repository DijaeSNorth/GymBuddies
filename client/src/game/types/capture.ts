import type { Buddy, BuddyDiscipline, BuddySpecies } from './buddy';
import type { TrainerMuscleId } from './trainer';

export type CaptureMoveId = 'burst' | 'grind' | 'snap';

export type CaptureAdvantage = 'strong' | 'favored' | 'even' | 'risky';

export type CaptureCounterState = 'counter' | 'countered' | 'neutral';

export type CaptureOpponentTendencyId =
  | 'surge'
  | 'anchor'
  | 'reader'
  | 'balanced';

export type CaptureBattleSpeed = 'swift' | 'standard' | 'deliberate';

export type CaptureBattleSpeedDefinition = {
  id: CaptureBattleSpeed;
  label: string;
  description: string;
  animationMs: number;
};

export type CaptureMove = {
  id: CaptureMoveId;
  title: string;
  tactic: string;
  summary: string;
  power: number;
  control: number;
  staminaCost: number;
  randomSwing: {
    min: number;
    max: number;
  };
  counters: CaptureMoveId;
  counteredBy: CaptureMoveId;
  trainerMuscles: Array<{
    id: TrainerMuscleId;
    weight: number;
  }>;
  buddyDisciplines: BuddyDiscipline[];
};

export type CaptureOpponentIntent = {
  moveId: CaptureMoveId;
  tendencyId: CaptureOpponentTendencyId;
  tendencyLabel: string;
  tell: string;
  confidence: 'clear' | 'mixed';
};

export type CaptureMovePrediction = {
  moveId: CaptureMoveId;
  advantage: CaptureAdvantage;
  counterState: CaptureCounterState;
  staminaAfter: number;
  staminaTone: 'ready' | 'strained' | 'spent';
  reasons: string[];
};

export type CaptureRoundSummary = {
  playerMoveId: CaptureMoveId;
  opponentMoveId: CaptureMoveId;
  counterState: CaptureCounterState;
  meterDelta: number;
  playerStaminaSpent: number;
  opponentStaminaSpent: number;
  repetitionPenalty: number;
  muscleAlignment: number;
  buddyAlignment: number;
};

export type Encounter = {
  creature: BuddySpecies;
  level: number;
  zoneId: string;
  catchChance: number;
  isBoss: boolean;
  bossName?: string;
  bossId?: string;
  bossPowerBonus?: number;
  bossScheduleCycle?: number;
  bossChallengeMachineId?: string;
  bossChallengeMachineName?: string;
  bossRequiredMoveId?: CaptureMoveId;
  bossRequiredMoveName?: string;
  bossSignatureRuleId?: string;
  bossArenaEffectId?: string;
  bossChallengeTier?: BossChallengeTier;
};

export type Match = {
  encounter: Encounter;
  status:
    | 'idle'
    | 'playing'
    | 'pin-win'
    | 'escape'
    | 'failed-pin'
    | 'near-capture'
    | 'captured'
    | 'full-party';
  round: number;
  maxRounds: number;
  meter: number;
  playerStamina: number;
  opponentStamina: number;
  playerMoveHistory: CaptureMoveId[];
  opponentMoveHistory: CaptureMoveId[];
  opponentIntent: CaptureOpponentIntent;
  lastRound: CaptureRoundSummary | null;
  pendingCapturedBuddy: Buddy | null;
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
  overloadMissLimit: number;
};
