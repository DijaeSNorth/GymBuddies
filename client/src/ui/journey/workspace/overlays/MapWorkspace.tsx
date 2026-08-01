import { useMemo, useState } from 'react';

import type { JourneyController } from '../../JourneyShell';

type MapWorkspaceProps = Readonly<{
  controller: JourneyController;
  onClose: () => void;
}>;

export function MapWorkspace({ controller, onClose }: MapWorkspaceProps) {
  const {
    AREAS,
    WORLD_ROUTE_PATHS,
    activeZone,
    connectedZones,
    getRouteTransitionPreview,
    isTraveling,
    isZoneUnlocked,
    save,
    travelToZone,
    worldMoveBlocked,
    worldPlayerPos,
    zoneNames,
  } = controller;
  const [selectedZoneId, setSelectedZoneId] = useState(save.activeZoneId);
  const selectedPreview = useMemo(
    () => getRouteTransitionPreview(selectedZoneId),
    [getRouteTransitionPreview, selectedZoneId],
  );
  const selectedZone = AREAS.find((area) => area.id === selectedZoneId) ?? activeZone;
  const canTravel = Boolean(
    selectedZoneId !== save.activeZoneId &&
      selectedPreview?.canTravelNow &&
      !isTraveling &&
      !worldMoveBlocked,
  );

  return (
    <div className="journey-map-workspace">
      <section className="journey-map-graph" aria-label="Connected fitness world">
        <div className="journey-map-current">
          <strong>{zoneNames[save.activeZoneId] ?? activeZone.name}</strong>
          <small>
            Trainer tile {worldPlayerPos.x + 1}, {worldPlayerPos.y + 1}
          </small>
        </div>
        <div className="journey-map-routes" aria-label="World routes">
          {WORLD_ROUTE_PATHS.map((route) => (
            <span key={`${route.from}-${route.to}`}>
              {route.routeName} / +{route.travelFatigue.toFixed(1)} fatigue /{' '}
              {Math.round(route.encounterBoost * 100)}% scouting boost
            </span>
          ))}
        </div>
        <div className="journey-map-nodes">
          {AREAS.map((area) => {
            const active = area.id === save.activeZoneId;
            const connected = connectedZones.includes(area.id);
            const unlocked = isZoneUnlocked(area.id);
            return (
              <button
                key={area.id}
                type="button"
                className={`${active ? 'active' : ''} ${unlocked ? '' : 'locked'}`}
                aria-pressed={area.id === selectedZoneId}
                onClick={() => setSelectedZoneId(area.id)}
              >
                <span aria-hidden="true">{area.type === 'home' ? 'HOME' : 'GYM'}</span>
                <strong>{area.name}</strong>
                <small>
                  {active
                    ? 'Current'
                    : !unlocked
                      ? 'Locked'
                      : connected
                        ? 'Adjacent route'
                        : 'Unlocked network'}
                </small>
                <small>Boss {controller.getGymBossTicker(area)}</small>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="journey-map-preview" aria-label="Travel preview">
        <span className="journey-overlay-kicker">TRAVEL PREVIEW</span>
        <h3>{selectedZone.name}</h3>
        <p>{selectedZone.blurb}</p>
        {selectedPreview ? (
          <dl>
            <div><dt>Route</dt><dd>{selectedPreview.routeName}</dd></div>
            <div><dt>Path</dt><dd>{selectedPreview.routePathName}</dd></div>
            <div><dt>Fatigue</dt><dd>+{selectedPreview.fatigueCost.toFixed(1)}</dd></div>
            <div><dt>Encounter</dt><dd>{Math.round(selectedPreview.encounterChance * 100)}%</dd></div>
            <div><dt>Boss</dt><dd>{selectedPreview.bossTicker}</dd></div>
            <div><dt>Access</dt><dd>{selectedPreview.isUnlocked ? 'Unlocked' : 'Locked'}</dd></div>
          </dl>
        ) : (
          <p className="small-note">You are already at this location.</p>
        )}
        <button
          className="journey-overlay-primary"
          type="button"
          disabled={!canTravel}
          onClick={() => {
            travelToZone(selectedZoneId);
            onClose();
          }}
        >
          {selectedZoneId === save.activeZoneId
            ? 'Current Location'
            : selectedPreview?.isUnlocked
              ? `Confirm travel to ${selectedZone.name}`
              : 'Route Locked'}
        </button>
        {!canTravel && selectedZoneId !== save.activeZoneId ? (
          <small>
            {!selectedPreview?.isUnlocked
              ? 'Visit and complete adjacent gyms to open this route.'
              : worldMoveBlocked
                ? 'Wait for the current stride lock to clear.'
                : 'This location is not currently reachable.'}
          </small>
        ) : null}
      </aside>
    </div>
  );
}
