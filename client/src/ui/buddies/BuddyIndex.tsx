import { useMemo, useState } from 'react';

import type { BuddyDiscipline, BuddySpecies } from '../../game/types';
import { getBuddyCharacterDesign } from '../../game/content/buddyCharacters';
import { BuddySprite } from './BuddySprite';

type BuddyIndexProps = {
  species: readonly BuddySpecies[];
  seenDex: readonly number[];
  caughtDex: readonly number[];
};

type IndexFilter = 'all' | 'seen' | 'caught';

function labelDiscipline(discipline: BuddyDiscipline) {
  return discipline.charAt(0).toUpperCase() + discipline.slice(1);
}

function indexNumber(dex: number) {
  return `#${String(dex).padStart(3, '0')}`;
}

export function BuddyIndex({
  species,
  seenDex,
  caughtDex,
}: BuddyIndexProps) {
  const [filter, setFilter] = useState<IndexFilter>('all');
  const [selectedId, setSelectedId] = useState(
    () =>
      species.find((entry) => caughtDex.includes(entry.dex))?.id ??
      species.find((entry) => seenDex.includes(entry.dex))?.id ??
      species[0]?.id ??
      '',
  );
  const seen = useMemo(
    () => new Set([...seenDex, ...caughtDex]),
    [seenDex, caughtDex],
  );
  const caught = useMemo(() => new Set(caughtDex), [caughtDex]);
  const orderedSpecies = useMemo(
    () => [...species].sort((left, right) => left.dex - right.dex),
    [species],
  );
  const visibleSpecies = orderedSpecies.filter((entry) => {
    if (filter === 'caught') return caught.has(entry.dex);
    if (filter === 'seen') return seen.has(entry.dex);
    return true;
  });
  const selected =
    species.find((entry) => entry.id === selectedId) ?? orderedSpecies[0];
  const selectedSeen = selected ? seen.has(selected.dex) : false;
  const selectedCaught = selected ? caught.has(selected.dex) : false;
  const selectedDesign = selected
    ? getBuddyCharacterDesign(selected.id)
    : null;

  return (
    <section className="buddy-index" aria-labelledby="buddy-index-title">
      <div className="buddy-index-heading">
        <div>
          <h2 id="buddy-index-title">Gym Buddy Index</h2>
          <p className="small-note">
            Build a six-Buddy team across five training disciplines.
          </p>
        </div>
        <div className="buddy-index-totals" aria-label="Collection progress">
          <span>{seen.size}/{species.length} seen</span>
          <span>{caught.size}/{species.length} caught</span>
        </div>
      </div>

      <div className="buddy-index-filters" aria-label="Filter Gym Buddy Index">
        {(['all', 'seen', 'caught'] as const).map((option) => (
          <button
            aria-pressed={filter === option}
            className={filter === option ? 'active' : ''}
            key={option}
            onClick={() => setFilter(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>

      <div className="buddy-index-layout">
        <div className="dex-list" aria-label={`${filter} Gym Buddies`}>
          {visibleSpecies.length > 0 ? (
            visibleSpecies.map((entry) => {
              const isSeen = seen.has(entry.dex);
              const isCaught = caught.has(entry.dex);
              return (
                <button
                  aria-label={`${indexNumber(entry.dex)} ${
                    isSeen ? entry.name : 'Unseen Buddy'
                  }, ${isCaught ? 'caught' : isSeen ? 'seen' : 'hidden'}`}
                  aria-pressed={selected?.id === entry.id}
                  className={`dex-item ${isSeen ? 'is-seen' : 'is-hidden'} ${
                    isCaught ? 'is-caught' : ''
                  }`}
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  type="button"
                >
                  <span className="dex-num">{indexNumber(entry.dex)}</span>
                  <span className="dex-miniature" aria-hidden={!isSeen}>
                    {isSeen ? (
                      <BuddySprite
                        creature={entry}
                        compact
                        presentationContext="menu"
                      />
                    ) : (
                      <span className="dex-unknown">?</span>
                    )}
                  </span>
                  <span className="dex-copy">
                    <strong>{isSeen ? entry.name : 'Unknown'}</strong>
                    <small>{isCaught ? 'Caught' : isSeen ? 'Seen' : 'Hidden'}</small>
                    {isSeen ? (
                      <small>
                        {labelDiscipline(entry.primaryDiscipline)}
                        {entry.isExotic ? ' · Exotic' : ''}
                      </small>
                    ) : null}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="buddy-index-empty">
              No entries match this filter yet. Keep scouting.
            </p>
          )}
        </div>

        <div className="buddy-index-detail" aria-live="polite">
          {!selected || !selectedSeen ? (
            <>
              <div className="buddy-index-mystery" aria-hidden="true">?</div>
              <strong>Unseen Buddy</strong>
              <p>
                Scout encounter areas and rare-signal tiles to reveal this entry.
              </p>
            </>
          ) : (
            <>
              <div className="buddy-index-profile">
                <div className="buddy-index-sprite-stage">
                  <BuddySprite
                    creature={selected}
                    compact
                    presentationContext="menu"
                  />
                </div>
                <div>
                  <span className="dex-num">{indexNumber(selected.dex)}</span>
                  <h3>{selected.name}</h3>
                  <div className="buddy-discipline-row">
                    <span>{labelDiscipline(selected.primaryDiscipline)}</span>
                    {selected.secondaryDiscipline ? (
                      <span>{labelDiscipline(selected.secondaryDiscipline)}</span>
                    ) : null}
                    {selected.isExotic ? <span>Exotic</span> : null}
                  </div>
                </div>
              </div>
              <p>{selected.flavor}</p>
              <dl className="buddy-index-facts">
                <div>
                  <dt>Role</dt>
                  <dd>{selected.gameplayRole}</dd>
                </div>
                <div>
                  <dt>Habitat</dt>
                  <dd>{selected.habitat}</dd>
                </div>
                <div>
                  <dt>Nature</dt>
                  <dd>{selected.personality}</dd>
                </div>
                {selectedDesign ? (
                  <>
                    <div>
                      <dt>Build</dt>
                      <dd>{selectedDesign.buildLabel}</dd>
                    </div>
                    <div>
                      <dt>Specialty</dt>
                      <dd>{selectedDesign.trainingSpecialization}</dd>
                    </div>
                  </>
                ) : null}
              </dl>

              {selectedCaught ? (
                <>
                  <div className="buddy-stat-grid" aria-label={`${selected.name} base stats`}>
                    <span>HP <strong>{selected.baseHp}</strong></span>
                    <span>POW <strong>{selected.power}</strong></span>
                    <span>CTL <strong>{selected.control}</strong></span>
                    <span>STA <strong>{selected.stamina}</strong></span>
                    <span>FRM <strong>{selected.form}</strong></span>
                    <span>MOB <strong>{selected.mobility}</strong></span>
                    <span>VOL <strong>{selected.volume}</strong></span>
                  </div>
                  <div className="buddy-technique-card">
                    <strong>{selected.passiveAbility.name}</strong>
                    <span>Passive · {selected.passiveAbility.description}</span>
                  </div>
                  <div className="buddy-technique-card">
                    <strong>{selected.signatureMove.name}</strong>
                    <span>
                      Signature · {selected.signatureMove.description}
                    </span>
                  </div>
                  <p className="buddy-growth-note">
                    Growth: {selected.growthProfile.curve.replace('-', ' ')} ·{' '}
                    {selected.growthProfile.description}
                  </p>
                </>
              ) : (
                <p className="buddy-index-lock-note">
                  Capture this Buddy through an arm-wrestling encounter to reveal
                  its full stats, passive, signature move, and growth profile.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
