import { Suspense } from 'react';

import type { JourneyController } from '../../JourneyShell';

type TeamWorkspaceProps = Readonly<{
  controller: JourneyController;
}>;

export function TeamWorkspace({ controller }: TeamWorkspaceProps) {
  const {
    LazyBuddyCustomizer,
    MAX_BUDDY_FORM,
    MAX_BUDDY_MOBILITY,
    MAX_BUDDY_VOLUME,
    PixelCreature,
    TEAM_SIZE,
    activeBuddy,
    buddyCustomizationOpen,
    getExperienceNeeded,
    hpPercent,
    save,
    selectBuddy,
    setBuddyCustomizationOpen,
    setSave,
  } = controller;

  return (
    <div className="journey-team-workspace">
      <section className="journey-team-list" aria-label="Party order">
        <div className="journey-overlay-section-heading">
          <div>
            <span className="journey-overlay-kicker">PARTY ORDER</span>
            <h3>{save.team.length}/{TEAM_SIZE} Buddies</h3>
          </div>
        </div>
        {Array.from({ length: TEAM_SIZE }, (_, index) => {
          const buddy = save.team[index];
          if (!buddy) {
            return (
              <span className="journey-team-row empty" key={`team-empty-${index}`}>
                SLOT {index + 1} / EMPTY
              </span>
            );
          }
          return (
            <button
              key={buddy.id}
              type="button"
              className={index === save.activeIndex ? 'active' : ''}
              onClick={() => selectBuddy(index)}
              aria-pressed={index === save.activeIndex}
            >
              <span aria-hidden="true">
                <PixelCreature
                  cosmetics={buddy.cosmetics}
                  creature={buddy.creature}
                  pose="idle"
                  presentationContext="menu"
                  reducedMotion={save.accessibility.reducedMotion}
                  scale={1}
                />
              </span>
              <span>
                <strong>{index + 1}. {buddy.nickname}</strong>
                <small>{buddy.creature.name} / Lv {buddy.level}</small>
                <i><b style={{ width: `${hpPercent(buddy.hp, buddy.maxHp)}%` }} /></i>
              </span>
              <small>{buddy.hp}/{buddy.maxHp} HP</small>
            </button>
          );
        })}
      </section>

      <section className="journey-team-detail" aria-label="Active Buddy details">
        {activeBuddy ? (
          <>
            <div className="journey-team-hero">
              <PixelCreature
                cosmetics={activeBuddy.cosmetics}
                creature={activeBuddy.creature}
                pose="victory"
                presentationContext="showcase"
                reducedMotion={save.accessibility.reducedMotion}
                scale={1.6}
              />
              <div>
                <span className="journey-overlay-kicker">ACTIVE BUDDY</span>
                <h3>{activeBuddy.nickname}</h3>
                <p>{activeBuddy.creature.name} / {activeBuddy.creature.primaryDiscipline}</p>
              </div>
            </div>
            <dl className="journey-stat-grid">
              <div><dt>Level</dt><dd>{activeBuddy.level}</dd></div>
              <div><dt>XP</dt><dd>{activeBuddy.xp}/{getExperienceNeeded(activeBuddy.level)}</dd></div>
              <div><dt>HP</dt><dd>{activeBuddy.hp}/{activeBuddy.maxHp}</dd></div>
              <div><dt>Form</dt><dd>{activeBuddy.form}/{MAX_BUDDY_FORM}</dd></div>
              <div><dt>Mobility</dt><dd>{activeBuddy.mobility}/{MAX_BUDDY_MOBILITY}</dd></div>
              <div><dt>Volume</dt><dd>{activeBuddy.volume}/{MAX_BUDDY_VOLUME}</dd></div>
              <div><dt>Signature</dt><dd>{activeBuddy.creature.signatureMove.name}</dd></div>
              <div>
                <dt>Equipment</dt>
                <dd>{activeBuddy.cosmetics?.accessoryIds.join(', ') || 'None'}</dd>
              </div>
            </dl>
            <p className="journey-team-flavor">{activeBuddy.creature.flavor}</p>
            <button
              className="journey-overlay-primary"
              type="button"
              onClick={() => {
                controller.playtestServices.markChecklist('buddy-customization', true);
                setBuddyCustomizationOpen((open) => !open);
              }}
            >
              {buddyCustomizationOpen ? 'Close Buddy Style' : 'Customize Buddy'}
            </button>
            {buddyCustomizationOpen ? (
              <Suspense fallback={<p role="status">Loading Buddy customization...</p>}>
                <LazyBuddyCustomizer
                  buddy={activeBuddy}
                  onChange={(updatedBuddy) =>
                    setSave((state) => ({
                      ...state,
                      team: state.team.map((entry) =>
                        entry.id === updatedBuddy.id ? updatedBuddy : entry,
                      ),
                    }))
                  }
                  onClose={() => setBuddyCustomizationOpen(false)}
                  reducedMotion={save.accessibility.reducedMotion}
                />
              </Suspense>
            ) : null}
          </>
        ) : (
          <p>No active Buddy selected.</p>
        )}
      </section>
    </div>
  );
}
