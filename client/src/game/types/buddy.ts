export type PixelPalette = {
  skin: string;
  core: string;
  detail: string;
  accent: string;
};

export type BuddySpecies = {
  id: string;
  dex: number;
  name: string;
  speciesHint: string;
  flavor: string;
  isExotic: boolean;
  power: number;
  sprite: string[];
  palette: PixelPalette;
};

export type Buddy = {
  id: string;
  nickname: string;
  creature: BuddySpecies;
  level: number;
  hp: number;
  maxHp: number;
  xp: number;
  form: number;
  mobility: number;
  volume: number;
};

export type StarterBuddyDefinition = {
  id: string;
  speciesId: string;
  seed: number;
  level: number;
};
