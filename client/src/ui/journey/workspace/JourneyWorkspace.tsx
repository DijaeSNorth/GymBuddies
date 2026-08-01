import {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from 'react';

import { AppErrorBoundary } from '../../errors/AppErrorBoundary';
import { downloadSaveJson } from '../../save/saveDownload';
import type { JourneyController } from '../JourneyShell';
import { CompactStatusBar } from './CompactStatusBar';
import { ContextActionRail } from './ContextActionRail';
import { DialogueBar } from './DialogueBar';
import { EncounterStage } from './EncounterStage';
import { JourneyOverlayHost } from './JourneyOverlayHost';
import { PartyRail } from './PartyRail';
import { QuickNavigation } from './QuickNavigation';
import { BuddyIndexWorkspace } from './overlays/BuddyIndexWorkspace';
import { MapWorkspace } from './overlays/MapWorkspace';
import { SettingsWorkspace } from './overlays/SettingsWorkspace';
import { SystemWorkspace } from './overlays/SystemWorkspace';
import { TeamWorkspace } from './overlays/TeamWorkspace';
import { TrainingWorkspace } from './overlays/TrainingWorkspace';
import type { JourneyWorkspaceId } from './workspaceTypes';
import './journeyWorkspace.css';

type JourneyWorkspaceProps = Readonly<{
  controller: JourneyController;
}>;

const WORKSPACE_TITLES: Partial<Record<JourneyWorkspaceId, string>> = {
  map: 'World Map',
  team: 'Team',
  training: 'Training',
  'buddy-index': 'Buddy Index',
  settings: 'Settings',
  system: 'System Menu',
};

export function JourneyWorkspace({ controller }: JourneyWorkspaceProps) {
  const [activeWorkspace, setActiveWorkspace] =
    useState<JourneyWorkspaceId>('play');

  const openWorkspace = useCallback(
    (workspace: JourneyWorkspaceId) => {
      if (workspace === 'physique') {
        setActiveWorkspace('play');
        controller.openPhysiqueReview();
        return;
      }
      if (workspace === 'playtest') {
        setActiveWorkspace('play');
        window.dispatchEvent(new Event('gym-buddies:open-playtest'));
        return;
      }
      if (workspace === 'save') {
        setActiveWorkspace('system');
        return;
      }
      if (workspace === 'inventory') {
        setActiveWorkspace('team');
        return;
      }
      setActiveWorkspace(workspace);
    },
    [controller],
  );
  const closeWorkspace = useCallback(() => setActiveWorkspace('play'), []);

  useEffect(() => {
    document.body.classList.add('gb-journey-active');
    return () => document.body.classList.remove('gb-journey-active');
  }, []);

  useEffect(() => {
    if (controller.encounter || controller.match) setActiveWorkspace('play');
  }, [controller.encounter, controller.match]);

  useEffect(() => {
    if (controller.workoutSession) setActiveWorkspace('training');
  }, [controller.workoutSession]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches('input, textarea, select') ||
        target?.isContentEditable
      ) {
        return;
      }
      if (event.key === 'Escape' && activeWorkspace !== 'play') {
        event.preventDefault();
        closeWorkspace();
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.code === 'KeyT') {
        event.preventDefault();
        openWorkspace('team');
      } else if (event.code === 'KeyI') {
        event.preventDefault();
        openWorkspace('buddy-index');
      } else if (
        event.code === 'KeyM' &&
        !target?.closest('[data-game-presentation="true"]')
      ) {
        event.preventDefault();
        openWorkspace('map');
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [activeWorkspace, closeWorkspace, openWorkspace]);

  const overlayTitle = WORKSPACE_TITLES[activeWorkspace];
  const overlayOpen = activeWorkspace !== 'play' && Boolean(overlayTitle);
  const overlayPausesGameplay = overlayOpen && activeWorkspace !== 'training';
  const movementDisabled = Boolean(
    activeWorkspace !== 'play' ||
      controller.isTraveling ||
      controller.encounter ||
      controller.match ||
      controller.workoutSession ||
      controller.physiqueReviewOpen,
  );

  return (
    <div
      className="journey-workspace-shell"
      data-gameplay-paused={controller.gameplayPaused ? 'true' : 'false'}
      data-workspace={activeWorkspace}
    >
      <CompactStatusBar controller={controller} openWorkspace={openWorkspace} />

      <main className="journey-workspace-main">
        <PartyRail controller={controller} openWorkspace={openWorkspace} />

        <section className="journey-playfield" aria-label="Main game playfield">
          <AppErrorBoundary
            resetKey={controller.save.activeZoneId}
            onError={() =>
              controller.playtestServices.recordError(
                'phaser-presentation',
                'The playfield presentation stopped and entered recovery.',
              )
            }
            onRetry={() =>
              controller.playtestServices.recordEvent(
                'phaser-recovered',
                'Playfield presentation retry requested',
              )
            }
            fallback={({ retry }) => (
              <section className="game-presentation-loading" role="alert">
                <div>
                  <strong>The playfield presentation stopped.</strong>
                  <p>Journey progress remains safe outside Phaser.</p>
                  <div className="action-row">
                    <button className="primary-btn" onClick={retry} type="button">Retry playfield</button>
                    <button className="secondary-btn" onClick={() => downloadSaveJson(controller.save)} type="button">Export save</button>
                    <button className="secondary-btn" onClick={controller.onReturnToOpening} type="button">Return to setup</button>
                  </div>
                </div>
              </section>
            )}
          >
            <Suspense
              fallback={
                <section className="game-presentation-loading" role="status" aria-live="polite">
                  Preparing the 240x160 playfield...
                </section>
              }
            >
              <controller.LazyGamePresentation
                accessibility={controller.save.accessibility}
                actionLabel={controller.presentationActionLabel}
                battleSpeed={controller.save.captureBattleSpeed}
                condensed
                dialogue={controller.message}
                dialoguePortrait={controller.dialoguePortrait}
                directionAvailability={controller.overworldDirectionAvailability}
                effectSkippable={Boolean(
                  controller.captureAnimation ||
                    controller.bossEntrance ||
                    controller.zoneTransit,
                )}
                externallyPaused={overlayPausesGameplay}
                keyboardBindings={controller.save.input.keyboardBindings}
                movementDisabled={movementDisabled}
                onAccessibilityChange={controller.setAccessibilitySettings}
                onAction={controller.handlePresentationAction}
                onBattleSpeedChange={controller.setCaptureBattleSpeed}
                onKeyboardBindingsChange={controller.setKeyboardBindings}
                onMenuRequest={() => openWorkspace('system')}
                onPauseChange={controller.handleGameplayPauseChange}
                onSkipEffect={controller.skipPresentationSequence}
                onVisualProgressionChange={controller.setVisualProgressionPreferences}
                partyCount={controller.save.team.length}
                primaryActionDisabled={Boolean(
                  overlayOpen ||
                    controller.captureAnimation ||
                    (controller.match && controller.match.status !== 'playing'),
                )}
                snapshot={controller.gamePresentationSnapshot}
                visualProgression={controller.save.visualProgression.preferences}
              />
            </Suspense>
          </AppErrorBoundary>
          {controller.encounter ? <EncounterStage controller={controller} /> : null}
        </section>

        <ContextActionRail controller={controller} openWorkspace={openWorkspace} />
      </main>

      <DialogueBar controller={controller} />
      <QuickNavigation
        activeWorkspace={activeWorkspace}
        openWorkspace={openWorkspace}
      />

      {overlayOpen && overlayTitle ? (
        <JourneyOverlayHost
          workspace={activeWorkspace as Exclude<JourneyWorkspaceId, 'play'>}
          title={overlayTitle}
          onClose={closeWorkspace}
        >
          {activeWorkspace === 'map' ? (
            <MapWorkspace controller={controller} onClose={closeWorkspace} />
          ) : activeWorkspace === 'team' ? (
            <TeamWorkspace controller={controller} />
          ) : activeWorkspace === 'training' ? (
            <TrainingWorkspace controller={controller} />
          ) : activeWorkspace === 'buddy-index' ? (
            <BuddyIndexWorkspace controller={controller} />
          ) : activeWorkspace === 'settings' ? (
            <SettingsWorkspace controller={controller} />
          ) : activeWorkspace === 'system' ? (
            <SystemWorkspace
              controller={controller}
              onOpenPlaytest={() => openWorkspace('playtest')}
            />
          ) : null}
        </JourneyOverlayHost>
      ) : null}
    </div>
  );
}
