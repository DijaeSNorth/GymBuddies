export const TRAINER_ASSET_KEYS = {
  overworld: 'trainer.overworld.base',
} as const;

export const BUDDY_ASSET_KEYS = {
  'brawny-bear': {
    overworld: 'buddy.brawny-bear.overworld',
    battle: 'buddy.brawny-bear.battle',
  },
  'titan-tortoise': {
    overworld: 'buddy.titan-tortoise.overworld',
    battle: 'buddy.titan-tortoise.battle',
  },
  'iron-wolf': {
    overworld: 'buddy.iron-wolf.overworld',
    battle: 'buddy.iron-wolf.battle',
  },
  'muscled-boar': {
    overworld: 'buddy.muscled-boar.overworld',
    battle: 'buddy.muscled-boar.battle',
  },
} as const;

export const MACHINE_ASSET_KEYS = {
  home_recovery: 'machine.home-recovery.animation',
  home_dumbbells: 'machine.home-dumbbells.animation',
  home_plate: 'machine.home-plate.animation',
  home_bike: 'machine.home-bike.animation',
} as const;

export const BOSS_ASSET_KEYS = {
  'home-watchman': 'boss.home-watchman.portrait',
  'a-rhino': 'boss.a-rhino.portrait',
} as const;

export const CONTENT_ASSET_REFERENCES = [
  ...Object.values(TRAINER_ASSET_KEYS),
  ...Object.values(BUDDY_ASSET_KEYS).flatMap((binding) => Object.values(binding)),
  ...Object.values(MACHINE_ASSET_KEYS),
  ...Object.values(BOSS_ASSET_KEYS),
] as string[];
