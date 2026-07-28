export type BossSchedule = {
  nextBossAt: number;
  defeated?: number;
};

export type GymBoss = {
  id: string;
  name: string;
  speciesId: string;
  levelShift: number;
  catchMultiplier: number;
  powerBoost: number;
};

export type GymBossRoster = {
  id: string;
  gymId: string;
  bosses: GymBoss[];
};
