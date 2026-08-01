import type { JourneyController } from '../../JourneyShell';

type SystemWorkspaceProps = Readonly<{
  controller: JourneyController;
  onOpenPlaytest: () => void;
}>;

export function SystemWorkspace({
  controller,
  onOpenPlaytest,
}: SystemWorkspaceProps) {
  const {
    SaveManagementPanel,
    onEditTrainer,
    onRestartJourney,
    onReturnToOpening,
    resetTutorial,
    save,
    saveServices,
  } = controller;

  return (
    <div className="journey-system-workspace">
      <section>
        <span className="journey-overlay-kicker">SAVE</span>
        <h3>Journey data</h3>
        <SaveManagementPanel
          canRestorePrevious={saveServices.previousSaveAvailable}
          loadIssues={saveServices.loadIssues}
          loadMessage={saveServices.loadMessage}
          onImportJson={saveServices.importJourneyJson}
          onRestorePrevious={saveServices.restorePreviousJourney}
          save={save}
        />
      </section>
      <section className="journey-system-actions">
        <span className="journey-overlay-kicker">JOURNEY</span>
        <h3>Trainer and tutorial</h3>
        <button type="button" aria-label="Edit Trainer" onClick={onEditTrainer}>Edit trainer appearance</button>
        <button type="button" onClick={resetTutorial}>Restart tutorial</button>
        <button type="button" onClick={onReturnToOpening}>Return to opening</button>
        <button type="button" className="danger" onClick={onRestartJourney}>
          Restart entire journey
        </button>
      </section>
      <section className="journey-system-playtest">
        <span className="journey-overlay-kicker">OPTIONAL ALPHA TOOLS</span>
        <h3>Playtest and privacy</h3>
        <p>
          Playtest notes stay in this browser. Nothing uploads automatically;
          exporting and sharing a report is always your choice.
        </p>
        <button
          type="button"
          onClick={onOpenPlaytest}
        >
          Open playtest tools
        </button>
      </section>
    </div>
  );
}
