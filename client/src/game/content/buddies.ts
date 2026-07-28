import type { BuddySpecies, StarterBuddyDefinition } from '../types';

export const BUDDY_SPECIES: BuddySpecies[] = [
  {
    id: 'brawny-bear',
    dex: 1,
    name: 'Brawny Bear',
    speciesHint: 'Bear',
    flavor: 'A real bear turned into a grappler with a loud chest slam.',
    isExotic: false,
    power: 26,
    sprite: ['..SSSS..', '.SSMMSS.', 'SSMMMMSS', 'SMMDDMMS', 'SMMMMMMS', 'SMMMMMMS', 'SMMSMMSM', '..SSSS..'],
    palette: { skin: '#f2c48c', core: '#5f3a26', detail: '#f7e0a8', accent: '#7b4e24' },
  },
  {
    id: 'titan-tortoise',
    dex: 2,
    name: 'Titan Tortoise',
    speciesHint: 'Tortoise',
    flavor: 'Shell first, then a heavy shoulder lock with little mercy.',
    isExotic: false,
    power: 22,
    sprite: ['..GGGG..', '.GGMMGG.', 'GGHHHHGG', 'GWWHHWWG', 'GWWHHWWG', 'GGHHHHGG', '.GGGGGG.', '..GGGG..'],
    palette: { skin: '#dbc39e', core: '#4f7345', detail: '#f5dd8f', accent: '#8d5f2d' },
  },
  {
    id: 'iron-wolf',
    dex: 3,
    name: 'Iron Wolf',
    speciesHint: 'Wolf',
    flavor: 'It waits until your hands tremble, then hits the center line.',
    isExotic: false,
    power: 24,
    sprite: ['..EEE...', '..EHHH..', '.EHHHHH.', 'EMMHHHHE', 'EMMHHMHE', 'EEMMHHHE', '.EEMMHE.', '..EE....'],
    palette: { skin: '#d6c8a0', core: '#4d4f58', detail: '#2f2e6b', accent: '#f1c45f' },
  },
  {
    id: 'muscled-boar',
    dex: 4,
    name: 'Muscled Boar',
    speciesHint: 'Boar',
    flavor: 'Short range, high pressure, no room for sloppy grips.',
    isExotic: false,
    power: 23,
    sprite: ['.RRRRRR.', 'RRRRRRRR', 'RRMMMMRR', 'RMMMMMMR', 'RMMMDDRR', 'RRMDDMRR', '.RRRMMR.', '..RRRR..'],
    palette: { skin: '#f2b074', core: '#7b2d1f', detail: '#7a4f2b', accent: '#6c8b45' },
  },
  {
    id: 'ripped-rhino',
    dex: 5,
    name: 'Ripped Rhino',
    speciesHint: 'Rhino',
    flavor: 'One horn-like push can decide the entire encounter.',
    isExotic: false,
    power: 29,
    sprite: ['..HHHH..', '.HHHHHH.', 'HHHHHHHH', 'HHMMMMHH', 'HHMMMMHH', 'HMMMMMMH', '.HHHHHH.', '..HHHH..'],
    palette: { skin: '#eadbc0', core: '#7a7d84', detail: '#8e4e38', accent: '#c58a56' },
  },
  {
    id: 'boulder-bison',
    dex: 6,
    name: 'Boulder Bison',
    speciesHint: 'Bison',
    flavor: 'Burst first, squeeze until your wrists burn, then keep it tight.',
    isExotic: false,
    power: 27,
    sprite: ['..PPPP..', '.PPPPPP.', 'PPWWWWPP', 'PWWMMWWP', 'PWWMMWWP', 'PWWWWWWP', '.PWWWWP.', '..PPPP..'],
    palette: { skin: '#efe3bc', core: '#7f5a38', detail: '#6c4d2e', accent: '#c7a84e' },
  },
  {
    id: 'buff-otter',
    dex: 7,
    name: 'Buff Otter',
    speciesHint: 'Otter',
    flavor: 'Looks easygoing, but its core locks are deceptive.',
    isExotic: false,
    power: 21,
    sprite: ['..GGGG..', '.GGMMGG.', 'GGMWWMGG', 'GMWWWWMG', 'GMGGGGMG', 'GMGMMGMG', 'GGMMMMGG', '..GGGG..'],
    palette: { skin: '#d3aa86', core: '#53709b', detail: '#925c37', accent: '#f6dfa1' },
  },
  {
    id: 'slycera-griffin',
    dex: 50,
    name: 'Slycera Griffin',
    speciesHint: 'Griffin',
    flavor: 'A mythic winged body that refuses cheap captures.',
    isExotic: true,
    power: 34,
    sprite: ['..AAAA..', '.AAMMEE.', 'AAMMWWAA', 'AAWWWWAA', 'AAMWWWAA', 'AAWWWWAA', '.AAMWAA.', '..AAAA..'],
    palette: { skin: '#f7d28f', core: '#c23b50', detail: '#ffefba', accent: '#5a4ed6' },
  },
  {
    id: 'cinder-manticore',
    dex: 51,
    name: 'Cinder Manticore',
    speciesHint: 'Manticore',
    flavor: 'Mythic cat-body reflexes with heavy core resistance.',
    isExotic: true,
    power: 38,
    sprite: ['..FFFF..', 'FFFFFFFF', 'FFMMMMFF', 'FMMWWWFF', 'FMMWWWFF', 'FMWWWWMF', 'F.MWWWF.', '..FFFF..'],
    palette: { skin: '#f4c67a', core: '#4c4cd9', detail: '#f8f1bf', accent: '#ad3f6c' },
  },
  {
    id: 'hydra-lurcher',
    dex: 52,
    name: 'Hydra Lurcher',
    speciesHint: 'Hydra',
    flavor: 'Mythic stamina and repeated counters in the final rounds.',
    isExotic: true,
    power: 40,
    sprite: ['..BBBB..', '.BBBBBB.', 'BBBBBBBB', 'BBMBBMBB', 'BBMMMMBB', 'BMMMBBMB', '.BBBBBB.', '..BBBB..'],
    palette: { skin: '#f6ab63', core: '#302f64', detail: '#b84848', accent: '#a25f34' },
  },
  {
    id: 'pygmy-sable-pegasus',
    dex: 53,
    name: 'Pygmy Sable Pegasus',
    speciesHint: 'Pegasus',
    flavor: 'It uses elegant footwork to escape until you find a seam.',
    isExotic: true,
    power: 36,
    sprite: ['..CCCC..', '.CCMMCC.', 'CCMMMMCC', 'CMWWWWMC', 'CMWMMWMC', 'CMWMMWMC', '.CMWWMC.', '..CCCC..'],
    palette: { skin: '#f3cc97', core: '#385db3', detail: '#fbe5b0', accent: '#8d71eb' },
  },
  {
    id: 'titan-gorilla',
    dex: 54,
    name: 'Titan Gorilla',
    speciesHint: 'Gorilla',
    flavor: 'Quiet, low-gear pressure. Then a brutal last pull.',
    isExotic: false,
    power: 30,
    sprite: ['..BBBB..', '.BBBBBB.', 'BBMMMMBB', 'BBMDDMBB', 'BBMMMMBB', 'BBMMMMBB', '.BBBBBB.', '..BBBB..'],
    palette: { skin: '#d6ad7b', core: '#5f4d33', detail: '#b67a46', accent: '#8b4f2e' },
  },
];

export const BUDDY_SPECIES_BY_ID = new Map(BUDDY_SPECIES.map((species) => [species.id, species]));
export const BUDDY_SPECIES_BY_DEX = new Map(BUDDY_SPECIES.map((species) => [species.dex, species]));

export const STARTER_BUDDIES: StarterBuddyDefinition[] = [
  { id: 'starter-brawny-bear', speciesId: 'brawny-bear', seed: 1, level: 5 },
  { id: 'starter-titan-tortoise', speciesId: 'titan-tortoise', seed: 2, level: 4 },
];

export const FANCY_NAMES = [
  'Muscle Mommy',
  'Bench Bro',
  'Squat Siren',
  'Curl Captain',
  'Plate Whisperer',
  'Wrist-Railer',
  'Grip Guru',
  'Dumbbell Diva',
  'Snatch Ninja',
  'Rope Rebel',
  'Tough Toad',
  'Pectoral Pete',
  'Iron Mama',
];

export function getBuddySpeciesById(id: string) {
  const species = BUDDY_SPECIES_BY_ID.get(id);
  if (!species) {
    throw new Error(`Unknown Buddy species "${id}".`);
  }
  return species;
}

export function resolveBuddySpeciesIdentity(
  species: BuddySpecies | Omit<BuddySpecies, 'id'>,
): BuddySpecies {
  if ('id' in species && species.id) {
    return species;
  }

  const canonical = BUDDY_SPECIES_BY_DEX.get(species.dex);
  return {
    ...species,
    id: canonical?.id ?? `legacy-dex-${species.dex}`,
  };
}
