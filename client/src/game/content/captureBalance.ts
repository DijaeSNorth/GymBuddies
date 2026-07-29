import type {
  BuddyDiscipline,
  CaptureBattleSpeedDefinition,
  CaptureMoveId,
  CaptureOpponentTendencyId,
  GymKind,
} from '../types';

export const CAPTURE_STAMINA_MAX = 100;
export const WILD_CAPTURE_CONTROL_TARGET = 72;
export const CAPTURE_ESCAPE_METER = 24;
export const CAPTURE_METER_MIN = 16;
export const CAPTURE_METER_MAX = 94;

export const CAPTURE_ROUND_RULES = {
  playerRecovery: 5,
  opponentRecovery: 4,
  repeatPenaltyStep: 4,
  repeatPenaltyMaximum: 12,
  counterBonus: 10,
  counterPenalty: 9,
  maximumHistory: 6,
} as const;

export const CAPTURE_ZONE_DIFFICULTY: Record<
  GymKind,
  {
    opponentPressure: number;
    opponentControl: number;
    staminaPressure: number;
  }
> = {
  home: {
    opponentPressure: -2,
    opponentControl: -1,
    staminaPressure: 0,
  },
  starter: {
    opponentPressure: 2,
    opponentControl: 1,
    staminaPressure: 2,
  },
  higher: {
    opponentPressure: 7,
    opponentControl: 3,
    staminaPressure: 5,
  },
};

export const CAPTURE_BATTLE_SPEEDS: CaptureBattleSpeedDefinition[] = [
  {
    id: 'swift',
    label: 'Swift',
    description: 'Short 160 ms impact beats.',
    animationMs: 160,
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Readable 280 ms impact beats.',
    animationMs: 280,
  },
  {
    id: 'deliberate',
    label: 'Deliberate',
    description: 'Longer 440 ms impact beats.',
    animationMs: 440,
  },
];

export const CAPTURE_OPPONENT_TENDENCIES: Record<
  CaptureOpponentTendencyId,
  {
    id: CaptureOpponentTendencyId;
    label: string;
    moveWeights: Record<CaptureMoveId, number>;
  }
> = {
  surge: {
    id: 'surge',
    label: 'Surge starter',
    moveWeights: { burst: 0.58, grind: 0.27, snap: 0.15 },
  },
  anchor: {
    id: 'anchor',
    label: 'Patient anchor',
    moveWeights: { burst: 0.16, grind: 0.62, snap: 0.22 },
  },
  reader: {
    id: 'reader',
    label: 'Counter reader',
    moveWeights: { burst: 0.2, grind: 0.25, snap: 0.55 },
  },
  balanced: {
    id: 'balanced',
    label: 'Balanced adapter',
    moveWeights: { burst: 0.34, grind: 0.36, snap: 0.3 },
  },
};

export const CAPTURE_DISCIPLINE_TENDENCY: Record<
  BuddyDiscipline,
  CaptureOpponentTendencyId
> = {
  power: 'surge',
  technique: 'reader',
  endurance: 'anchor',
  mobility: 'reader',
  recovery: 'anchor',
};

export const CAPTURE_MOVE_TELLS: Record<
  CaptureMoveId,
  {
    clear: string;
    mixed: string;
  }
> = {
  burst: {
    clear: 'Its shoulder coils high—an explosive drive is coming.',
    mixed: 'Its shoulder keeps twitching toward a quick drive.',
  },
  grind: {
    clear: 'Its elbow settles and its grip squares for steady pressure.',
    mixed: 'Its posture lowers into a patient center hold.',
  },
  snap: {
    clear: 'Its wrist turns loose, ready to hook a committed drive.',
    mixed: 'Its hand floats outside center, watching for an opening.',
  },
};

export const CAPTURE_MOVE_COUNTERS: Record<CaptureMoveId, CaptureMoveId> = {
  burst: 'grind',
  grind: 'snap',
  snap: 'burst',
};
