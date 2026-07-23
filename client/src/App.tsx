import { useEffect, useMemo, useState } from 'react';

type PixelPalette = {
  skin: string;
  core: string;
  detail: string;
  accent: string;
};

type Creature = {
  dex: number;
  name: string;
  speciesHint: string;
  flavor: string;
  isExotic: boolean;
  power: number;
  sprite: string[];
  palette: PixelPalette;
};

type Buddy = {
  id: string;
  nickname: string;
  creature: Creature;
  level: number;
  hp: number;
  maxHp: number;
  xp: number;
};

type GymArea = {
  id: string;
  name: string;
  type: 'home' | 'starter' | 'higher';
  levelMin: number;
  levelMax: number;
  blurb: string;
};

type Encounter = {
  creature: Creature;
  level: number;
  zoneId: string;
  catchChance: number;
};

type Move = {
  id: 'burst' | 'grind' | 'snap';
  title: string;
  tactic: string;
  power: number;
  control: number;
};

type Match = {
  encounter: Encounter;
  status: 'idle' | 'playing' | 'won' | 'escape' | 'failed' | 'full';
  round: number;
  maxRounds: number;
  meter: number;
  lines: string[];
};

type SaveData = {
  version: string;
  steroids: number;
  activeIndex: number;
  activeZoneId: string;
  team: Buddy[];
  seenDex: number[];
  caughtDex: number[];
};

const SAVE_KEY = 'gymbuddies-save-v3';
const TEAM_SIZE = 6;

const AREAS: GymArea[] = [
  {
    id: 'home',
    name: 'Home Gym',
    type: 'home',
    levelMin: 1,
    levelMax: 1,
    blurb: 'Train and heal your team before entering encounters.',
  },
  {
    id: 'starter-a',
    name: 'Starter Gym A',
    type: 'starter',
    levelMin: 1,
    levelMax: 15,
    blurb: 'Low-risk captures and friendly arena pressure.',
  },
  {
    id: 'starter-b',
    name: 'Starter Gym B',
    type: 'starter',
    levelMin: 16,
    levelMax: 25,
    blurb: 'Mid-game catches. Your control matters more here.',
  },
  {
    id: 'higher-1',
    name: 'Iron Gym',
    type: 'higher',
    levelMin: 26,
    levelMax: 35,
    blurb: 'Higher pressure and stronger opponents.',
  },
  {
    id: 'higher-2',
    name: 'Apex Gym',
    type: 'higher',
    levelMin: 36,
    levelMax: 45,
    blurb: 'Late-band creatures, better prediction beats brute force.',
  },
  {
    id: 'higher-3',
    name: 'Glory Gym',
    type: 'higher',
    levelMin: 36,
    levelMax: 55,
    blurb: 'Rare encounters and mythological pressure matches.',
  },
];

const MOVES: Move[] = [
  { id: 'burst', title: 'Shoulder Burst', tactic: 'fast elbow drive', power: 16, control: -4 },
  { id: 'grind', title: 'Iron Grind', tactic: 'constant center-line pressure', power: 10, control: 10 },
  { id: 'snap', title: 'Snapping Hook', tactic: 'quick short push', power: 13, control: -1 },
];

const CREATURES: Creature[] = [
  {
    dex: 1,
    name: 'Brawny Bear',
    speciesHint: 'Bear',
    flavor: 'A real bear turned into a grappler with a loud chest slam.',
    isExotic: false,
    power: 26,
    sprite: ['..SSS..', '.SSMSS.', 'SSMMMMS', 'SMMMMMS', 'SMMMMS.', 'SMMMM.', '.SSS..', '...S..'],
    palette: { skin: '#f2c48c', core: '#5f3a26', detail: '#f7e0a8', accent: '#7b4e24' },
  },
  {
    dex: 2,
    name: 'Titan Tortoise',
    speciesHint: 'Tortoise',
    flavor: 'Shell first, then a heavy shoulder lock with little mercy.',
    isExotic: false,
    power: 22,
    sprite: ['.GGG..', 'GGGGG', 'GDDDG', 'GMMMG', 'GMMMG', 'GMMMG', 'GGGG.', '.GG..'],
    palette: { skin: '#dbc39e', core: '#4f7345', detail: '#f5dd8f', accent: '#8d5f2d' },
  },
  {
    dex: 3,
    name: 'Iron Wolf',
    speciesHint: 'Wolf',
    flavor: 'It waits until your hands tremble, then hits the center line.',
    isExotic: false,
    power: 24,
    sprite: ['..EEE.', '.EEME.', 'EMMMME', 'EMMMM.', 'EMMMME', 'EEEE..', '.EEE..', '..E...'],
    palette: { skin: '#d6c8a0', core: '#4d4f58', detail: '#2f2e6b', accent: '#f1c45f' },
  },
  {
    dex: 4,
    name: 'Muscled Boar',
    speciesHint: 'Boar',
    flavor: 'Short range, high pressure, no room for sloppy grips.',
    isExotic: false,
    power: 23,
    sprite: ['.RRRR.', 'RRRRR', 'RMMMM', 'RMMMM', 'RRRRR', '.RRR.', '..RR.', '.R.R.'],
    palette: { skin: '#f2b074', core: '#7b2d1f', detail: '#7a4f2b', accent: '#6c8b45' },
  },
  {
    dex: 5,
    name: 'Ripped Rhino',
    speciesHint: 'Rhino',
    flavor: 'One horn-like push can decide the entire encounter.',
    isExotic: false,
    power: 29,
    sprite: ['..HH..', '.HHHH.', 'HMMMMH', 'HMMMMH', '.HHHH.', '..HH..', '.HHHH.', 'H....H'],
    palette: { skin: '#eadbc0', core: '#7a7d84', detail: '#8e4e38', accent: '#c58a56' },
  },
  {
    dex: 6,
    name: 'Boulder Bison',
    speciesHint: 'Bison',
    flavor: 'Burst first, squeeze until your wrists burn, then keep it tight.',
    isExotic: false,
    power: 27,
    sprite: ['.PPPP.', 'PPPPPP', 'PWWWWP', 'PWWWWP', '.PWWP.', '..WW..', '.W..W.', 'WWWWW.'],
    palette: { skin: '#efe3bc', core: '#7f5a38', detail: '#6c4d2e', accent: '#c7a84e' },
  },
  {
    dex: 7,
    name: 'Buff Otter',
    speciesHint: 'Otter',
    flavor: 'Looks easygoing, but its core locks are deceptive.',
    isExotic: false,
    power: 21,
    sprite: ['.GGGG.', '.GMMM.', 'GMMEM.', 'GMMMMG', 'GMMMG.', '.GMMG.', '.GGG..', '..G...'],
    palette: { skin: '#d3aa86', core: '#53709b', detail: '#925c37', accent: '#f6dfa1' },
  },
  {
    dex: 50,
    name: 'Slycera Griffin',
    speciesHint: 'Griffin',
    flavor: 'A mythic winged body that refuses cheap captures.',
    isExotic: true,
    power: 34,
    sprite: ['..AAAA.', '.AAAAAA', 'AAEEAA', 'AWWWWA', '.AWWA.', '.WMMW.', '.WMMW.', '.WWWW.'],
    palette: { skin: '#f7d28f', core: '#c23b50', detail: '#ffefba', accent: '#5a4ed6' },
  },
  {
    dex: 51,
    name: 'Cinder Manticore',
    speciesHint: 'Manticore',
    flavor: 'Mythic cat-body reflexes with heavy core resistance.',
    isExotic: true,
    power: 38,
    sprite: ['.FFFFF.', 'FFFFFFF', 'FMMMFF', 'FFMMFF', '.FWWF.', 'F.WWF.F', 'F.....F', '.FFF..'],
    palette: { skin: '#f4c67a', core: '#4c4cd9', detail: '#f8f1bf', accent: '#ad3f6c' },
  },
  {
    dex: 52,
    name: 'Hydra Lurcher',
    speciesHint: 'Hydra',
    flavor: 'Mythic stamina and repeated counters in the final rounds.',
    isExotic: true,
    power: 40,
    sprite: ['...BBB.', '..BBBB.', '.BMMBB.', 'BMMMMB', 'BMMEBB', '.BMMB.', '.BMMB.', 'BBBBB.'],
    palette: { skin: '#f6ab63', core: '#302f64', detail: '#b84848', accent: '#a25f34' },
  },
  {
    dex: 53,
    name: 'Pygmy Sable Pegasus',
    speciesHint: 'Pegasus',
    flavor: 'It uses elegant footwork to escape until you find a seam.',
    isExotic: true,
    power: 36,
    sprite: ['...CCC.', '.CCCCC.', 'CCMMCC', 'CMWWMC', 'CMMMMC', '.CWWC.', '..CC..', 'CC..CC'],
    palette: { skin: '#f3cc97', core: '#385db3', detail: '#fbe5b0', accent: '#8d71eb' },
  },
  {
    dex: 54,
    name: 'Titan Gorilla',
    speciesHint: 'Gorilla',
    flavor: 'Quiet, low-gear pressure. Then a brutal last pull.',
    isExotic: false,
    power: 30,
    sprite: ['.BBBB.', 'BBBBBB', 'BMMWMB', 'BMMMMB', '.BMMB.', '.BBBB.', '.B..B.', 'BBBBB.'],
    palette: { skin: '#d6ad7b', core: '#5f4d33', detail: '#b67a46', accent: '#8b4f2e' },
  },
];

const FANCY_NAMES = [
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

const zoneNames = Object.fromEntries(AREAS.map((a) => [a.id, a.name])) as Record<string, string>;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(items: T[]) {
  return items[randInt(0, items.length - 1)];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getCatchChance(level: number, isExotic: boolean) {
  if (isExotic) return 0.4;
  if (level <= 15) return 0.9;
  if (level <= 25) return 0.85;
  if (level <= 35) return 0.8;
  return 0.7;
}

function xpNeeded(level: number) {
  return Math.max(8, level * 5);
}

function seedBuddy(seed: number, creature: Creature, level = 4): Buddy {
  const maxHp = 34 + level * 4;
  return {
    id: `seed-${seed}`,
    nickname: `${randomChoice(FANCY_NAMES)} #${seed}`,
    creature,
    level,
    hp: maxHp,
    maxHp,
    xp: 0,
  };
}

function classForPixel(cell: string) {
  switch (cell) {
    case 'M':
    case 'S':
      return 'pixel-main';
    case 'D':
      return 'pixel-core';
    case 'E':
      return 'pixel-detail';
    case 'W':
      return 'pixel-core';
    case 'H':
    case 'P':
      return 'pixel-accent';
    case 'R':
      return 'pixel-detail';
    default:
      return 'pixel-empty';
  }
}

function PixelCreature({ creature }: { creature: Creature }) {
  return (
    <div
      className="pixel-sprite"
      style={{
        '--skin': creature.palette.skin,
        '--core': creature.palette.core,
        '--detail': creature.palette.detail,
        '--accent': creature.palette.accent,
      } as Record<string, string>}
    >
      {creature.sprite.map((row, r) => (
        <div className="pixel-row" key={`r-${r}`}>
          {[...row].map((cell, c) => (
            <span key={`${r}-${c}`} className={`pixel ${classForPixel(cell)}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function createOpponent(zone: GymArea): Encounter {
  const mythicChance = zone.type === 'higher' ? 0.22 : zone.type === 'starter' ? 0.1 : 0;
  const pool = CREATURES.filter((c) => c.isExotic === (Math.random() < mythicChance));
  const source = pool.length > 0 ? pool : CREATURES.filter((c) => !c.isExotic);
  const creature = randomChoice(source);
  const level = randInt(zone.levelMin, zone.levelMax);
  return { creature, level, zoneId: zone.id, catchChance: getCatchChance(level, creature.isExotic) };
}

function applyXpGain(buddy: Buddy, bonus: number) {
  let xp = buddy.xp + bonus;
  let level = buddy.level;
  let maxHp = buddy.maxHp;
  let leveled = false;

  while (xp >= xpNeeded(level)) {
    xp -= xpNeeded(level);
    level += 1;
    maxHp += 3;
    leveled = true;
  }

  return {
    leveled,
    buddy: {
      ...buddy,
      xp,
      level,
      maxHp,
      hp: clamp(buddy.hp + (leveled ? 12 : 5), 1, maxHp),
    },
  };
}

function initialSaveData(): SaveData {
  const fallback: SaveData = {
    version: 'v3',
    steroids: 3,
    activeIndex: 0,
    activeZoneId: 'home',
    team: [seedBuddy(1, CREATURES[0], 5), seedBuddy(2, CREATURES[1], 4)],
    seenDex: [1, 2],
    caughtDex: [1, 2],
  };

  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (!parsed || parsed.version !== 'v3') {
      return fallback;
    }

    const team = (parsed.team ?? fallback.team).slice(0, TEAM_SIZE).map((buddy) => ({
      ...buddy,
      level: Math.max(1, buddy.level),
      hp: Math.max(1, Math.min(buddy.maxHp, buddy.hp)),
      maxHp: Math.max(18, buddy.maxHp),
      xp: Math.max(0, buddy.xp),
    }));

    return {
      ...fallback,
      ...parsed,
      team,
      activeIndex: clamp(parsed.activeIndex ?? 0, 0, Math.max(0, team.length - 1)),
      steroids: Math.max(0, parsed.steroids ?? 3),
      seenDex: parsed.seenDex ?? fallback.seenDex,
      caughtDex: parsed.caughtDex ?? fallback.caughtDex,
      activeZoneId: parsed.activeZoneId ?? 'home',
    };
  } catch {
    return fallback;
  }
}

export default function App() {
  const [save, setSave] = useState<SaveData>(initialSaveData);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [message, setMessage] = useState('Welcome to Gym Buddies. Start from Home Gym and build your team.');
  const [log, setLog] = useState<string[]>([
    'Home Gym open. Team and capture loop ready.',
    '6 Gym world loaded. Steroids work like level-up candies.',
  ]);

  const activeZone = useMemo(
    () => AREAS.find((area) => area.id === save.activeZoneId) ?? AREAS[0],
    [save.activeZoneId],
  );

  const activeBuddy = save.team[save.activeIndex] ?? null;
  const seenDex = useMemo(() => [...save.seenDex].sort((a, b) => a - b), [save.seenDex]);
  const caughtDex = useMemo(() => [...save.caughtDex].sort((a, b) => a - b), [save.caughtDex]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }, [save]);

  function pushLog(entry: string) {
    setLog((prev) => [entry, ...prev].slice(0, 12));
  }

  function switchArea(id: string) {
    if (id === save.activeZoneId) return;
    setSave((state) => ({ ...state, activeZoneId: id }));
    setEncounter(null);
    setMatch(null);
    setMessage(`Moved to ${zoneNames[id]}.`);
  }

  function selectBuddy(index: number) {
    if (!save.team[index]) return;
    setSave((state) => ({ ...state, activeIndex: index }));
    setMessage(`Selected ${save.team[index].nickname}.`);
  }
  function trainActive() {
    if (activeZone.type !== 'home') {
      setMessage('Training only works in Home Gym.');
      return;
    }
    if (!activeBuddy) return;

    const gain = randInt(2, 5);
    const result = applyXpGain(activeBuddy, gain);
    const steroidDrop = Math.random() < 0.3;

    setSave((state) => ({
      ...state,
      steroids: state.steroids + (steroidDrop ? 1 : 0),
      team: state.team.map((buddy, index) =>
        index === state.activeIndex
          ? {
              ...result.buddy,
            }
          : buddy,
      ),
    }));

    setMessage(
      `${activeBuddy.nickname} trained: +${gain}xp${result.leveled ? ' and leveled up.' : ''}${
        steroidDrop ? ' Found one Steroid.' : ''
      }`,
    );
    pushLog(`${activeBuddy.nickname} trained for +${gain}xp.`);
  }

  function useSteroid() {
    if (activeZone.type !== 'home') {
      setMessage('Steroids only work in Home Gym.');
      return;
    }
    if (!activeBuddy) return;
    if (save.steroids <= 0) {
      setMessage('No Steroids left. Train more to earn one.');
      return;
    }

    const result = applyXpGain(activeBuddy, 4);
    setSave((state) => ({
      ...state,
      steroids: state.steroids - 1,
      team: state.team.map((buddy, index) =>
        index === state.activeIndex
          ? {
              ...result.buddy,
            }
          : buddy,
      ),
    }));

    setMessage(
      `${activeBuddy.nickname} used 1 Steroid.${result.leveled ? ' Leveled up to Lv ' + result.buddy.level + '.' : ''}`,
    );
    pushLog(`Used Steroid on ${activeBuddy.nickname}.`);
  }

  function beginEncounter() {
    if (activeZone.type === 'home') {
      setMessage('Leave Home Gym to scout a wild buddy.');
      return;
    }
    if (!activeBuddy) {
      setMessage('Pick an active buddy before scouting.');
      return;
    }
    const next = createOpponent(activeZone);
    setEncounter(next);
    setMatch(null);
    setSave((state) => ({
      ...state,
      seenDex: state.seenDex.includes(next.creature.dex)
        ? state.seenDex
        : [...state.seenDex, next.creature.dex],
    }));
    setMessage(`${zoneNames[next.zoneId]}: wild ${next.creature.name} Lv.${next.level} appeared.`);
    pushLog(`Spawned ${next.creature.name} Lv.${next.level} (${zoneNames[next.zoneId]}).`);
  }

  function startMatch() {
    if (!encounter || !activeBuddy) return;
    if (match) return;

    setMatch({
      encounter,
      status: 'playing',
      round: 1,
      maxRounds: 4,
      meter: 50,
      lines: [
        'You and the wild buddy hit the mat and lock elbows. Keep the pressure on.',
        'The hold starts at a neutral meter. Push it to your side to pin.',
      ],
    });
    setMessage('Arm-wrestle match started.');
  }

  function resolveMatch(meter: number, playerWonLine: string[]) {
    if (!match) return;

    const base = match.encounter.catchChance;
    const bonus = clamp((meter - 50) / 150, -0.25, 0.22);
    const finalChance = clamp(base + bonus, 0.08, 0.97);
    const passHold = meter >= 72;

    const lines = [...playerWonLine];

    if (!passHold) {
      const escape = meter <= 24;
      setMatch((current) =>
        current
          ? {
              ...current,
              status: escape ? 'escape' : 'failed',
              lines: [...lines, escape ? 'It slips out at the end.' : 'You are close, but not enough.'],
              meter,
            }
          : current,
      );
      setMessage(escape ? 'The wild buddy breaks loose.' : 'You missed the pin.');
      setEncounter(escape ? null : encounter);
      return;
    }

    const roll = Math.random();
    if (roll > finalChance) {
      setMatch((current) =>
        current
          ? {
              ...current,
              status: 'failed',
              meter,
              lines: [...lines, 'You almost had it, but its final twitch breaks the pin.'],
            }
          : current,
      );
      setMessage('The hold was almost won, but catch failed.');
      return;
    }

    const newBuddy: Buddy = {
      id: `${encounter!.creature.dex}-${Date.now()}`,
      nickname: `${randomChoice(FANCY_NAMES)} #${encounter!.creature.dex}`,
      creature: encounter!.creature,
      level: encounter!.level,
      hp: 32 + encounter!.level * 2,
      maxHp: 42 + encounter!.level * 2,
      xp: 0,
    };

    if (save.team.length >= TEAM_SIZE) {
      setMatch((current) =>
        current
          ? {
              ...current,
              status: 'full',
              meter,
              lines: [...lines, 'You win the pin, but your team is already full.'],
            }
          : current,
      );
      setMessage('Captured, but team is full.');
      return;
    }

    setSave((state) => ({
      ...state,
      team: [...state.team, newBuddy],
      caughtDex: state.caughtDex.includes(encounter!.creature.dex)
        ? state.caughtDex
        : [...state.caughtDex, encounter!.creature.dex],
      activeIndex: state.activeIndex >= state.team.length ? state.team.length - 1 : state.activeIndex,
    }));

    setMatch((current) =>
      current
        ? {
            ...current,
            status: 'won',
            meter,
            lines: [
              ...lines,
              'You flatten your bodies, elbows locked, and drag the pressure down.',
              `YOU WIN THE ARMWRESTLE. ${encounter!.creature.name} cries like a baby and joins your squad.`,
            ],
          }
        : current,
    );
    setEncounter(null);
    setMessage(`Captured ${encounter!.creature.name} as ${newBuddy.nickname}.`);
    pushLog(`Captured ${encounter!.creature.name} Lv.${encounter!.level}.`);
  }

  function performMove(move: Move) {
    if (!match || !match.encounter || match.status !== 'playing' || !activeBuddy) {
      return;
    }

    const playerBase = activeBuddy.level * 2 + move.power + move.control + randInt(-5, 9);
    const wildBase = match.encounter.level * 2 + match.encounter.creature.power + randInt(-4, 12);
    const delta = playerBase - wildBase;
    const nextMeter = clamp(match.meter + Math.floor(delta / 2), 20, 92);
    const round = match.round + 1;

    const line =
      delta >= 8
        ? `${move.title}: you crush the first edge and pull control.`
        : delta >= 0
          ? `${move.title}: pressure stays balanced; keep it up.`
          : `${move.title}: wild buddy resisted and pushed back.`;

    const nextLines = [...match.lines, `${line} (${move.tactic}).`, `Round ${match.round}: meter ${nextMeter}%.`];

    if (match.round >= match.maxRounds || nextMeter >= 92 || nextMeter <= 20) {
      resolveMatch(nextMeter, nextLines);
      return;
    }

    setMatch((current) =>
      current
        ? {
            ...current,
            round,
            meter: nextMeter,
            lines: nextLines,
          }
        : current,
    );
    setMessage('Round complete. Push once more.');
  }

  function hpPercent(value: number, max: number) {
    return Math.round((value / max) * 100);
  }

  function percent(v: number) {
    return `${Math.round(v * 100)}%`;
  }

  return (
    <div className="app-shell">
      <header className="top-banner">
        <h1>GYM BUDDIES</h1>
        <p>Pixel RPG clone with 6 gyms, creature captures, and gym-themed progression.</p>
      </header>

      <main className="game-grid">
        <section className="panel">
          <div className="panel-head-row">
            <h2>Gym Map</h2>
            <span className="chip">Party {save.team.length}/{TEAM_SIZE}</span>
          </div>

          <div className="gym-grid">
            {AREAS.map((area) => (
              <button
                key={area.id}
                className={`gym-btn ${area.type} ${save.activeZoneId === area.id ? 'active' : ''}`}
                onClick={() => switchArea(area.id)}
              >
                <strong>{area.name}</strong>
                <span>{area.blurb}</span>
                <small>{area.type.toUpperCase()}</small>
              </button>
            ))}
          </div>

          <p className="small-note">Current: {activeZone.name}</p>

          <div className="team-area">
            <h3>Team Slots (up to 6)</h3>
            <div className="team-slots">
              {Array.from({ length: TEAM_SIZE }).map((_, i) => {
                const buddy = save.team[i];
                const active = save.activeIndex === i;
                return (
                  <button
                    key={`slot-${i}`}
                    className={`team-slot ${active ? 'active' : ''}`}
                    disabled={!buddy}
                    onClick={() => selectBuddy(i)}
                  >
                    <strong>{`#${String(i + 1).padStart(2, '0')}`}</strong>
                    {buddy ? (
                      <>
                        <span>{buddy.nickname}</span>
                        <small>{buddy.creature.name}</small>
                        <em>
                          Lv {buddy.level} | HP {buddy.hp}/{buddy.maxHp} ({hpPercent(buddy.hp, buddy.maxHp)}%)
                        </em>
                      </>
                    ) : (
                      <span className="empty">EMPTY</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {activeBuddy ? (
            <>
              <h3>Active Buddy</h3>
              <div className="active-card">
                <PixelCreature creature={activeBuddy.creature} />
                <div className="active-copy">
                  <strong>{activeBuddy.nickname}</strong>
                  <p>{activeBuddy.creature.flavor}</p>
                  <div>Lv {activeBuddy.level}</div>
                  <div>
                    HP {activeBuddy.hp}/{activeBuddy.maxHp}
                  </div>
                  <div>XP {activeBuddy.xp}/{xpNeeded(activeBuddy.level)}</div>
                </div>
              </div>
              <div className="action-row">
                <button className="primary-btn" onClick={trainActive} disabled={activeZone.type !== 'home'}>
                  Train (+XP)
                </button>
                <button
                  className="primary-btn"
                  onClick={useSteroid}
                  disabled={activeZone.type !== 'home' || save.steroids <= 0}
                >
                  Use Steroid (x{save.steroids})
                </button>
              </div>
            </>
          ) : (
            <p className="small-note">No active buddy selected.</p>
          )}

          <div className="xp-track">
            <div className="xp-fill" style={{ width: `${(save.team.length / TEAM_SIZE) * 100}%` }} />
          </div>

          <button className="primary-btn" onClick={beginEncounter} disabled={activeZone.type === 'home'}>
            Scout Wild Buddy
          </button>
        </section>

        <section className="panel">
          <h2>Capture Arena</h2>
          {!encounter ? (
            <p className="small-note">No encounter active. Move to starter/higher gym and press Scout.</p>
          ) : (
            <>
              <div className="combat-stage">
                <div className="combat-row">
                  <div className="combat-figure">
                    {activeBuddy ? <PixelCreature creature={activeBuddy.creature} /> : <span>None</span>}
                    <span>You</span>
                  </div>
                  <div className="combat-vs">VS</div>
                  <div className="combat-figure">
                    <PixelCreature creature={encounter.creature} />
                    <span>{encounter.creature.name}</span>
                  </div>
                </div>

                <div className="encounter-data">
                  <div>Location: {zoneNames[encounter.zoneId]}</div>
                  <div>
                    Lv {encounter.level} � Catch Chance {percent(encounter.catchChance)}
                    {encounter.creature.isExotic ? ' (Exotic)' : ''}
                  </div>
                </div>
              </div>

              {!match ? (
                <button className="primary-btn" onClick={startMatch}>
                  Go flat and arm wrestle
                </button>
              ) : (
                <>
                  <div className="meter-track">
                    <div className="meter-fill" style={{ width: `${match.meter}%` }} />
                    <div className="meter-center" />
                    <div className="meter-pin" />
                  </div>
                  <div className="small-note">Round {match.round}/{match.maxRounds}</div>

                  {match.status === 'playing' && (
                    <div className="action-grid">
                      {MOVES.map((move) => (
                        <button key={move.id} className="primary-btn" onClick={() => performMove(move)}>
                          <span>{move.title}</span>
                          <small>{move.tactic}</small>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="narration">
                    {match.lines.map((line, index) => (
                      <p key={`${match.round}-${index}`}>{line}</p>
                    ))}
                  </div>

                  {match.status !== 'playing' && (
                    <div className="result-block">
                      {match.status === 'won' && <p className="crying">Creature is crying like a baby.</p>}
                      <p>
                        {match.status === 'won'
                          ? 'Capture complete.'
                          : match.status === 'full'
                            ? 'Team full.'
                            : match.status === 'escape'
                              ? 'Escaped.'
                              : 'Not caught.'}
                      </p>
                      <button
                        className="secondary-btn"
                        onClick={() => {
                          setMatch(null);
                          setEncounter(null);
                          setMessage('Arena reset. Scout again when ready.');
                        }}
                      >
                        Continue
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        <section className="panel">
          <h2>Gym Buddy Index</h2>
          <div className="dex-list">
            {CREATURES.map((creature) => {
              const seen = seenDex.includes(creature.dex);
              const caught = caughtDex.includes(creature.dex);
              return (
                <div key={creature.dex} className={`dex-item ${seen ? 'seen' : ''}`}>
                  <span className="dex-num">#{String(creature.dex).padStart(3, '0')}</span>
                  <div>
                    {seen ? creature.name : 'Unknown'}
                    <small>{caught ? 'Caught' : seen ? 'Seen' : 'Hidden'}</small>
                    <small>{creature.isExotic ? ' / Exotic' : ''}</small>
                  </div>
                </div>
              );
            })}
          </div>

          <h3>Log</h3>
          <ul className="log-list">
            {log.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="status-bar">
        <strong>Broadcast:</strong> {message}
      </footer>
    </div>
  );
}

