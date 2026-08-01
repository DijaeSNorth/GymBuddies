import { useRef } from 'react';

import type { JourneyController } from '../JourneyShell';
import type { OpenJourneyWorkspace } from './workspaceTypes';

type PartyRailProps = Readonly<{
  controller: JourneyController;
  openWorkspace: OpenJourneyWorkspace;
}>;

export function PartyRail({ controller, openWorkspace }: PartyRailProps) {
  const {
    PixelCreature,
    TEAM_SIZE,
    save,
    selectBuddy,
    setBuddyCustomizationOpen,
  } = controller;
  const holdTimerRef = useRef<number | null>(null);

  function stopHold() {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function openBuddyDetails(index: number, customize = false) {
    selectBuddy(index);
    if (customize) setBuddyCustomizationOpen(true);
    openWorkspace('team');
  }

  return (
    <aside className="journey-party-rail" aria-label="Party summary">
      <strong className="journey-rail-title">PARTY</strong>
      <div className="journey-party-slots">
        {Array.from({ length: TEAM_SIZE }, (_, index) => {
          const buddy = save.team[index];
          const active = index === save.activeIndex;
          if (!buddy) {
            return (
              <span
                className="journey-party-slot journey-party-empty"
                key={`party-empty-${index}`}
                aria-label={`Empty party slot ${index + 1}`}
              >
                {index + 1}
              </span>
            );
          }
          const hurt = buddy.hp < buddy.maxHp;
          const fatigued = save.trainingFatigue >= 70;
          const pumped = save.workoutMomentum > 0;
          return (
            <button
              key={buddy.id}
              type="button"
              className={`journey-party-slot ${active ? 'active' : ''}`}
              aria-pressed={active}
              aria-label={`${buddy.nickname}, level ${buddy.level}, HP ${buddy.hp} of ${buddy.maxHp}${active ? ', active' : ''}`}
              onClick={() => selectBuddy(index)}
              onDoubleClick={() => openBuddyDetails(index, true)}
              onContextMenu={(event) => {
                event.preventDefault();
                openBuddyDetails(index, true);
              }}
              onPointerDown={() => {
                stopHold();
                holdTimerRef.current = window.setTimeout(
                  () => openBuddyDetails(index, true),
                  550,
                );
              }}
              onPointerUp={stopHold}
              onPointerCancel={stopHold}
              onPointerLeave={stopHold}
            >
              <span className="journey-party-sprite" aria-hidden="true">
                <PixelCreature
                  cosmetics={buddy.cosmetics}
                  creature={buddy.creature}
                  pose={active ? 'idle' : 'training'}
                  presentationContext="menu"
                  reducedMotion={save.accessibility.reducedMotion}
                  scale={active ? 1.15 : 0.9}
                />
              </span>
              <span className="journey-party-copy">
                <strong>{buddy.nickname}</strong>
                <small>LV {buddy.level}</small>
              </span>
              <span className="journey-party-hp" aria-hidden="true">
                <i style={{ width: `${controller.hpPercent(buddy.hp, buddy.maxHp)}%` }} />
              </span>
              <span className="journey-party-status" aria-hidden="true">
                {hurt ? 'HP' : pumped ? 'P' : fatigued ? 'F' : 'OK'}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
