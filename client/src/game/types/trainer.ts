export type TrainerMuscleId =
  | 'shoulders'
  | 'chest'
  | 'arms'
  | 'triceps'
  | 'core'
  | 'quads'
  | 'calves'
  | 'back';

export type TrainerMuscles = Record<TrainerMuscleId, number>;

export type TrainerAppearance = {
  skin: string;
  hair: string;
  top: string;
  shoes: string;
  glove: string;
};

export type TrainerProfile = TrainerAppearance & {
  name: string;
  muscles: TrainerMuscles;
};

export type TrainerPreset = {
  id: string;
  profile: TrainerProfile;
};

export type TrainerMuscleAttribute = {
  id: TrainerMuscleId;
  key: TrainerMuscleId;
  label: string;
  detail: string;
};

export type FocusMuscleBoost = {
  muscle: TrainerMuscleId;
  weight: number;
};

export type TrainerFocusDefinition = {
  id: string;
  boosts: FocusMuscleBoost[];
};

export type TrainerEmote = 'neutral' | 'grind' | 'focus' | 'level' | 'victory' | 'drained' | 'ready' | 'pump';
