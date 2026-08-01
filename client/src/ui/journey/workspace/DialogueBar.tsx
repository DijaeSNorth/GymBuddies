import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import { formatKeyboardCode } from '../../../game/input/actionMap';
import type { JourneyController } from '../JourneyShell';

const TEXT_SPEED_MS = {
  slow: 52,
  standard: 30,
  fast: 14,
  instant: 0,
} as const;

type DialogueBarProps = Readonly<{
  controller: JourneyController;
}>;

export function DialogueBar({ controller }: DialogueBarProps) {
  const {
    currentTutorialText,
    dialoguePortrait,
    finishTutorialNow,
    log,
    message,
    nextTutorialStep,
    presentationActionLabel,
    previousTutorialStep,
    save,
    tutorialActive,
  } = controller;
  const [historyOpen, setHistoryOpen] = useState(false);
  const activeMessage = tutorialActive ? currentTutorialText : message;
  const [cursor, setCursor] = useState(activeMessage.length);
  const speed = save.accessibility.textSpeed;
  const primaryKey = useMemo(
    () =>
      formatKeyboardCode(
        save.input.keyboardBindings.interact[0] ??
          save.input.keyboardBindings.confirm[0] ??
          'Enter',
      ),
    [save.input.keyboardBindings],
  );

  useEffect(() => {
    if (save.accessibility.reducedMotion || speed === 'instant') {
      setCursor(activeMessage.length);
      return;
    }
    setCursor(0);
    const timer = window.setInterval(() => {
      setCursor((current) => {
        const next = Math.min(activeMessage.length, current + 1);
        if (next >= activeMessage.length) window.clearInterval(timer);
        return next;
      });
    }, TEXT_SPEED_MS[speed]);
    return () => window.clearInterval(timer);
  }, [activeMessage, save.accessibility.reducedMotion, speed]);

  return (
    <section className="journey-dialogue-bar" aria-label="Dialogue and current objective">
      <div
        className={`journey-dialogue-portrait journey-dialogue-portrait-${dialoguePortrait.kind}`}
        aria-hidden="true"
        style={{
          '--journey-portrait-accent': dialoguePortrait.accent,
          '--journey-portrait-base': dialoguePortrait.base,
        } as CSSProperties}
      >
        {dialoguePortrait.initial}
      </div>
      <div className="journey-dialogue-copy">
        <span>{tutorialActive ? 'CURRENT OBJECTIVE' : dialoguePortrait.name}</span>
        <p aria-hidden="true">{activeMessage.slice(0, cursor)}</p>
        <span className="visually-hidden" aria-live="polite">
          {activeMessage}
        </span>
      </div>
      {tutorialActive ? (
        <div className="journey-tutorial-controls" aria-label="Tutorial controls">
          <button
            type="button"
            onClick={previousTutorialStep}
            disabled={save.tutorialStep <= 0}
          >
            Back
          </button>
          <button type="button" className="primary" onClick={nextTutorialStep}>
            Next
          </button>
          <button type="button" onClick={finishTutorialNow}>Skip</button>
        </div>
      ) : (
        <span className="journey-control-hint">
          <kbd>{primaryKey}</kbd> {presentationActionLabel}
        </span>
      )}
      <button
        type="button"
        className="journey-log-button"
        aria-label={historyOpen ? 'Close message history' : 'Open message history'}
        aria-expanded={historyOpen}
        onClick={() => setHistoryOpen((open) => !open)}
      >
        LOG
      </button>
      {historyOpen ? (
        <aside className="journey-log-popover" aria-label="Recent message history">
          <strong>RECENT ACTIVITY</strong>
          <ol>
            {log.slice(-6).reverse().map((entry, index) => (
              <li key={`${index}-${entry}`}>{entry}</li>
            ))}
          </ol>
        </aside>
      ) : null}
    </section>
  );
}
