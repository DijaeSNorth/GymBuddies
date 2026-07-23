import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';

type MonsterBlueprint = {
  dex: number;
  species: string;
  nickTheme: string;
  description: string;
  isExotic: boolean;
  sprite: string[];
  palette: {
    skin: string;
    core: string;
    detail: string;
    accent: string;
    cry: string;
  };
};

type GymBuddy = {
  id: string;
  nick: string;
  level: number;
  hp: number;
  species: MonsterBlueprint;
};

type Encounter = {
  species: MonsterBlueprint;
  level: number;
  odds: number;
  state: 'idle' | 'caught' | 'failed' | 'full';
};

type CatchState = {
  status: 'running' | 'done';
  step: number;
  lines: string[];
  won: boolean;
};

const TEAM_CAPACITY = 6;
const SUCCESS_LINES = [
  'You and the wild buddy go flat on your stomachs and lock elbows.',
  'Both of you grind shoulder to shoulder, and neither gives an inch.',
  'The creature nearly tips you over, but you hold the center line.',
  'You push with one final burst, muscles locked, and you drag them down.',
  'You win the hold! They drop flat, crying like a baby.',
];

const FAILURE_LINES = [
  'You and the wild buddy go flat on your stomachs and lock elbows.',
  'The hold is brutal, and both sides shake with effort.',
  'It slips once, then again — you almost lose the wrist lock.',
  'The creature pushes once more and breaks your grip.',
  'You lose the match as it slips away.',
];

const gymBuddyNames = [
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
];

const speciesCatalog: MonsterBlueprint[] = [
  {
    dex: 1,
    species: 'Brawny Bear',
    nickTheme: 'Bear',
    description: 'A real bear turned trainer, broad-shouldered and fast to charge.',
    isExotic: false,
    sprite: ['..SSS..', '.SSMSS.', 'SSMMMMS', 'SMMMMMS', 'SMMMMS.', 'SMMMM.', '.SSS..', '...S..'],
    palette: { skin: '#f2c48c', core: '#5f3a26', detail: '#f7e0a8', accent: '#7b4e24', cry: '#dbeafe' },
  },
  {
    dex: 2,
    species: 'Titan Tortoise',
    nickTheme: 'Tortoise',
    description: 'Shell first, then shoulders. A turtle with gym-bro discipline.',
    isExotic: false,
    sprite: ['.GGG..', 'GGGGG', 'GDDDG', 'GMMMG', 'GMMMG', 'GMMMG', 'GGGG.', '.GG..'],
    palette: { skin: '#dbc39e', core: '#4f7345', detail: '#f5dd8f', accent: '#8d5f2d', cry: '#bfdbfe' },
  },
  {
    dex: 3,
    species: 'Iron Wolf',
    nickTheme: 'Wolf',
    description: 'Pack leader instincts and boulder arms; always ready to wrestle.',
    isExotic: false,
    sprite: ['..EEE.', '.EEME.', 'EMMMME', 'EMMMM.', 'EMMMME', 'EEEE..', '.EEE..', '..E...'],
    palette: { skin: '#d6c8a0', core: '#4d4f58', detail: '#2f2e6b', accent: '#f1c45f', cry: '#e0f2fe' },
  },
  {
    dex: 4,
    species: 'Muscled Boar',
    nickTheme: 'Boar',
    description: 'A boar with a thick chest and a lot of stubborn force.',
    isExotic: false,
    sprite: ['.RRRR.', 'RRRRR', 'RMMMM', 'RMMMM', 'RRRRR', '.RRR.', '..RR.', '.R.R.'],
    palette: { skin: '#f2b074', core: '#7b2d1f', detail: '#7a4f2b', accent: '#6c8b45', cry: '#fef3c7' },
  },
  {
    dex: 5,
    species: 'Ripped Rhino',
    nickTheme: 'Rhino',
    description: 'Small horn. Big chest. It uses one push and you feel it.',
    isExotic: false,
    sprite: ['..HH..', '.HHHH.', 'HMMMMH', 'HMMMMH', '.HHHH.', '..HH..', '.HHHH.', 'H....H'],
    palette: { skin: '#eadbc0', core: '#7a7d84', detail: '#8e4e38', accent: '#c58a56', cry: '#f3e8ff' },
  },
  {
    dex: 6,
    species: 'Boulder Bison',
    nickTheme: 'Bison',
    description: 'A bison that can sprint into every encounter with explosive pull-up power.',
    isExotic: false,
    sprite: ['.PPPP.', 'PPPPPP', 'PWWWWP', 'PWWWWP', '.PWWP.', '..WW..', '.W..W.', 'WWWWW.'],
    palette: { skin: '#efe3bc', core: '#7f5a38', detail: '#6c4d2e', accent: '#c7a84e', cry: '#bae6fd' },
  },
  {
    dex: 50,
    species: 'Slycera Griffin',
    nickTheme: 'Griffin',
    description: 'Mythical lion-eagle build. Strong wings and a dangerous hold.',
    isExotic: true,
    sprite: ['..AAAA.', '.AAAAAA', 'AAEEAA', 'AWWWWA', '.AWWA.', '.WMMW.', '.WMMW.', '.WWWW.'],
    palette: { skin: '#f7d28f', core: '#c23b50', detail: '#ffefba', accent: '#5a4ed6', cry: '#fecdd3' },
  },
  {
    dex: 51,
    species: 'Cinder Manticore',
    nickTheme: 'Manticore',
    description: 'Mythic cat body with fiery spirit. It refuses easy wins.',
    isExotic: true,
    sprite: ['.FFFFF.', 'FFFFFFF', 'FMMMFF', 'FFMMFF', '.FWWF.', 'F.WWF.F', 'F.....F', '.FFF..'],
    palette: { skin: '#f4c67a', core: '#4c4cd9', detail: '#f8f1bf', accent: '#ad3f6c', cry: '#fbcfe8' },
  },
  {
    dex: 52,
    species: 'Hydra Lurcher',
    nickTheme: 'Hydra',
    description: 'Mythical dog-bodied hydra with repeated pressure and huge leverage.',
    isExotic: true,
    sprite: ['...BBB.', '..BBBB.', '.BMMBB.', 'BMMMMB', 'BMMEBB', '.BMMB.', '.BMMB.', 'BBBBB.'],
    palette: { skin: '#f6ab63', core: '#302f64', detail: '#b84848', accent: '#a25f34', cry: '#ffd4dc' },
  },
  {
    dex: 53,
    species: 'Pygmy Sable Pegasus',
    nickTheme: 'Pegasus',
    description: 'Winged and muscular with sharp training instincts.',
    isExotic: true,
    sprite: ['...CCC.', '.CCCCC.', 'CCMMCC', 'CMWWMC', 'CMMMMC', '.CWWC.', '..CC..', 'CC..CC'],
    palette: { skin: '#f3cc97', core: '#385db3', detail: '#fbe5b0', accent: '#8d71eb', cry: '#ddd6fe' },
  },
  {
    dex: 7,
    species: 'Buff Otter',
    nickTheme: 'Otter',
    description: 'Playful at rest, ruthless in grip contests.',
    isExotic: false,
    sprite: ['.GGGG.', '.GMMM.', 'GMMEM.', 'GMMMMG', 'GMMMG.', '.GMMG.', '.GGG..', '..G...'],
    palette: { skin: '#d3aa86', core: '#53709b', detail: '#925c37', accent: '#f6dfa1', cry: '#bfdbfe' },
  },
];

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function catchRate(level: number, isExotic: boolean) {
  if (isExotic) return 0.4;
  if (level <= 15) return 0.9;
  if (level <= 25) return 0.85;
  if (level <= 35) return 0.8;
  return 0.7;
}

function getCatchLine(map: CatchState | null) {
  if (!map) return '';
  return map.lines[map.step];
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomName(seed: number) {
  return `${pickRandom(gymBuddyNames)} #${seed}`;
}

function classForPixel(cell: string) {
  if (cell === 'M') return 'pixel-main';
  if (cell === 'S') return 'pixel-skin';
  if (cell === 'D') return 'pixel-core';
  if (cell === 'E') return 'pixel-detail';
  if (cell === 'W') return 'pixel-core';
  if (cell === 'H') return 'pixel-accent';
  if (cell === 'R') return 'pixel-skin';
  if (cell === 'P') return 'pixel-detail';
  if (cell === 'F') return 'pixel-accent';
  if (cell === 'C') return 'pixel-main';
  return 'pixel-empty';
}

function PixelSprite({ monster }: { monster: MonsterBlueprint }) {
  return (
    <div
      className="pixel-sprite"
      style={
        {
          '--skin': monster.palette.skin,
          '--core': monster.palette.core,
          '--detail': monster.palette.detail,
          '--accent': monster.palette.accent,
        } as CSSProperties
      }
    >
      {monster.sprite.map((row, rowIndex) => (
        <div key={`r-${rowIndex}`} className="pixel-row">
          {[...row].map((cell, colIndex) => (
            <span key={`${rowIndex}-${colIndex}`} className={`pixel ${classForPixel(cell)}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const starter = speciesCatalog[0];
  const [team, setTeam] = useState<GymBuddy[]>([
    { id: 'seed-1', nick: 'Muscle Mommy', level: 5, hp: 56, species: starter },
    { id: 'seed-2', nick: 'Bench Bro', level: 4, hp: 48, species: speciesCatalog[1] },
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [dexSeen, setDexSeen] = useState<number[]>([1, 2]);
  const [catchState, setCatchState] = useState<CatchState | null>(null);
  const [message, setMessage] = useState('Welcome home to Gym HQ. Train your team and go catch new Gym Buddies.');
  const [steroids, setSteroids] = useState(3);
  const [log, setLog] = useState<string[]>(['Home gym initialized.', 'Press Start to find a wild buddy.']);

  const activeBuddy = team[activeIndex];
  const caughtText = getCatchLine(catchState);
  const catchResultFinished = catchState?.status === 'done';
  const knownDex = useMemo(() => [...dexSeen].sort((a, b) => a - b), [dexSeen]);
  const battling = catchState?.status === 'running';

  useEffect(() => {
    if (!catchState || catchState.status !== 'running') return;
    if (catchState.step < catchState.lines.length - 1) {
      const id = window.setTimeout(() => {
        setCatchState(current => {
          if (!current || current.status !== 'running') return current;
          return { ...current, step: current.step + 1 };
        });
      }, 760);
      return () => window.clearTimeout(id);
    }

    const doneId = window.setTimeout(() => {
      setCatchState(current => (current ? { ...current, status: 'done' } : current));

      setEncounter(current => {
        if (!current || !catchState.won) return current && { ...current, state: 'failed' };
        if (team.length >= TEAM_CAPACITY) {
          setMessage('Caught, but your team is full. Keep at most six Gym Buddies.');
          return { ...current, state: 'full' };
        }

        const newBuddy: GymBuddy = {
          id: `${current.species.dex}-${Date.now()}`,
          nick: randomName(current.species.dex),
          level: current.level,
          hp: 35 + current.level * 2,
          species: current.species,
        };
        setTeam(previous => [...previous, newBuddy]);
        setDexSeen(previous => (previous.includes(current.species.dex) ? previous : [...previous, current.species.dex]));
        setMessage(`Caught ${newBuddy.nick}! They joined your party as ${newBuddy.species.species}.`);
        setLog(prev => [`${newBuddy.species.species} Lv.${newBuddy.level} captured.`, ...prev.slice(0, 6)]);
        return { ...current, state: 'caught' };
      });
    }, 900);

    return () => window.clearTimeout(doneId);
  }, [catchState?.status, catchState?.step, team.length]);

  useEffect(() => {
    if (catchResultFinished && encounter && encounter.state === 'failed') {
      setMessage('The monster escaped before the last rep. Try again in the same encounter.');
    }
    if (catchResultFinished && encounter && encounter.state === 'caught') {
      setMessage('You win the arm wrestle match; the buddy cries and joins your team.');
    }
  }, [catchResultFinished, encounter]);

  function beginEncounter() {
    const selected = pickRandom(speciesCatalog);
    const level = Math.floor(Math.random() * 45) + 1;
    const odds = catchRate(level, selected.isExotic);
    setEncounter({ species: selected, level, odds, state: 'idle' });
    setCatchState(null);
    setDexSeen(previous => (previous.includes(selected.dex) ? previous : [...previous, selected.dex]));
    setMessage(`Encountered ${selected.species} (Level ${level}). Get on the floor and arm wrestle to catch.`);
    setLog(prev => [`Encounter found: ${selected.species} Lv.${level}`, ...prev.slice(0, 6)]);
  }

  function trainActive() {
    if (!activeBuddy) return;
    const nextLevel = Math.min(activeBuddy.level + 1, 100);
    const heal = Math.max(1, Math.floor(nextLevel / 3));
    const rewardSteroid = Math.random() < 0.22;

    setTeam(previous =>
      previous.map((buddy, index) =>
        index === activeIndex
          ? { ...buddy, level: nextLevel, hp: Math.min(120, buddy.hp + heal) }
          : buddy,
      ),
    );
    setMessage(`${activeBuddy.nick} trained hard and is now Lv ${nextLevel}.`);
    setLog(prev => [`${activeBuddy.nick} leveled to Lv.${nextLevel}.`, ...prev.slice(0, 6)]);
    if (rewardSteroid) {
      setSteroids(prev => prev + 1);
      setMessage(prev => `${prev} You found a Steroid from hard training.`);
    }
  }

  function useSteroid() {
    if (!activeBuddy || steroids <= 0) return;
    const nextLevel = Math.min(activeBuddy.level + 1, 100);
    setTeam(previous =>
      previous.map((buddy, index) =>
        index === activeIndex ? { ...buddy, level: nextLevel, hp: Math.min(120, buddy.hp + 1) } : buddy,
      ),
    );
    setSteroids(previous => previous - 1);
    setMessage(`Steroid applied: ${activeBuddy.nick} leveled to Lv ${nextLevel}.`);
  }

  function startCatchAttempt() {
    if (!encounter || encounter.state !== 'idle' || catchState) return;
    const roll = Math.random();
    const won = roll <= encounter.odds;
    setMessage(`Catch check roll: ${percent(roll)} target ${percent(encounter.odds)}.`);
    setCatchState({
      status: 'running',
      step: 0,
      lines: won ? SUCCESS_LINES : FAILURE_LINES,
      won,
    });
  }

  function returnHome() {
    setEncounter(null);
    setCatchState(null);
    setMessage('Back at the Home Gym. Train and retry your next catch.');
  }

  return (
    <div className="app-shell">
      <header className="top-banner">
        <h1>GYM BUDDIES</h1>
        <p>Pixel RPG clone for browser combat and capture</p>
      </header>

      <main className="game-grid">
        <section className="panel">
          <h2>Home Gym</h2>
          <div className="panel-row">
            <span className="chip">Party {team.length}/{TEAM_CAPACITY}</span>
            <span className="chip">Steroids: {steroids}</span>
          </div>

          <h3>Team Slots (Pokémon-style)</h3>
          <div className="team-slots">
            {Array.from({ length: TEAM_CAPACITY }).map((_, index) => {
              const slot = team[index];
              const isSelected = index === activeIndex;
              return (
                <button
                  key={`slot-${index}`}
                  onClick={() => slot && setActiveIndex(index)}
                  className={`team-slot ${isSelected ? 'active' : ''}`}
                  disabled={!slot}
                >
                  <strong>{`#${String(index + 1).padStart(2, '0')}`}</strong>
                  {slot ? (
                    <>
                      <span>{slot.nick}</span>
                      <small>{slot.species.species}</small>
                      <em>Lv {slot.level}</em>
                    </>
                  ) : (
                    <span className="empty">EMPTY</span>
                  )}
                </button>
              );
            })}
          </div>

          {activeBuddy && (
            <>
              <h3>Active Buddy</h3>
              <div className="active-card">
                <PixelSprite monster={activeBuddy.species} />
                <div className="active-copy">
                  <strong>{activeBuddy.nick}</strong>
                  <div>{activeBuddy.species.species}</div>
                  <div>Lv {activeBuddy.level}</div>
                  <div>HP {activeBuddy.hp}</div>
                  <p>{activeBuddy.species.description}</p>
                </div>
              </div>
              <div className="action-row">
                <button onClick={trainActive} className="primary-btn">
                  Train for +1
                </button>
                <button onClick={useSteroid} disabled={steroids <= 0} className="primary-btn">
                  Use Steroid (Lv candy) {steroids <= 0 ? '' : `x${steroids}`}
                </button>
              </div>
            </>
          )}

          <button onClick={beginEncounter} disabled={!!encounter} className="primary-btn">
            Begin wild encounter
          </button>
        </section>

        <section className="panel">
          <h2>Encounter / Capture</h2>
          {!encounter ? (
            <p className="small-note">No encounter. Return home and start hunting from Gym HQ.</p>
          ) : (
            <>
              <div className="combat-stage">
                <div className="combat-row">
                  <div className="combat-figure">
                    {activeBuddy ? <PixelSprite monster={activeBuddy.species} /> : null}
                    <span>You</span>
                  </div>
                  <div className="combat-vs">VS</div>
                  <div className="combat-figure">
                    <PixelSprite monster={encounter.species} />
                    <span>
                      {encounter.species.species}
                      {encounter.species.isExotic ? ' (Exotic)' : ''}
                    </span>
                  </div>
                </div>

                <div className="encounter-data">
                  <div>Lvl {encounter.level}</div>
                  <div>Catch Rate: {percent(encounter.odds)}{encounter.species.isExotic && ' (mythical)'} </div>
                  <div>State: {encounter.state}</div>
                  <div>Layout: 1v1 arm-wrestle on the gym mat</div>
                </div>
              </div>

              {encounter.state === 'idle' && !catchState && (
                <button onClick={startCatchAttempt} className="primary-btn">
                  Arm wrestle catch
                </button>
              )}
              {battling && <p className="narration">{caughtText}</p>}
              {catchResultFinished && encounter.state === 'idle' && (
                <p className={catchState?.won ? 'narration win' : 'narration'}>
                  {catchState?.won
                    ? `You pin it. ${encounter.species.species} cries at your feet.`
                    : `${encounter.species.species} escaped during the final count.`}
                </p>
              )}

              {(encounter.state === 'caught' || encounter.state === 'failed' || encounter.state === 'full') && (
                <div className="result-block">
                  <p>
                    {encounter.state === 'caught'
                      ? 'Caught.'
                      : encounter.state === 'full'
                        ? 'Caught, but team has 6/6 already.'
                        : 'Not caught this attempt.'}
                  </p>
                  <button onClick={returnHome} className="secondary-btn">
                    Return Home
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="panel">
          <h2>Gym Index</h2>
          <p className="small-note">Pokémon-like index, shown by dex number and seen status.</p>
          <div className="dex-list">
            {speciesCatalog.map(monster => {
              const seen = knownDex.includes(monster.dex);
              return (
                <div key={monster.dex} className={`dex-item ${seen ? 'seen' : 'unknown'}`}>
                  <span>{`#${String(monster.dex).padStart(3, '0')}`}</span>
                  {seen ? monster.species : '???'}
                  {seen && monster.isExotic ? ' [Mythical]' : ''}
                </div>
              );
            })}
          </div>

          <h3>Log</h3>
          <ul className="log-list">
            {log.map(entry => (
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
