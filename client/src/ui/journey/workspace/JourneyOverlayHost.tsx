import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import {
  gamepadActions,
  inputActionToDirection,
} from '../../../game/input/actionMap';
import { subscribeToGamepadFrames } from '../../../game/input/gamepadPolling';
import type { JourneyWorkspaceId } from './workspaceTypes';

type JourneyOverlayHostProps = Readonly<{
  children: ReactNode;
  onClose: () => void;
  title: string;
  workspace: Exclude<JourneyWorkspaceId, 'play'>;
}>;

function focusableElements(container: HTMLElement | null) {
  return Array.from(
    container?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  ).filter((element) => element.offsetParent !== null);
}

export function JourneyOverlayHost({
  children,
  onClose,
  title,
  workspace,
}: JourneyOverlayHostProps) {
  const panelRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    window.requestAnimationFrame(() => {
      const controls = focusableElements(panelRef.current);
      (controls[0] ?? panelRef.current)?.focus();
    });
    return () => restoreFocusRef.current?.focus();
  }, [workspace]);

  useEffect(() => {
    let previousActions = new Set<string>();
    return subscribeToGamepadFrames((gamepad) => {
      if (!gamepad || !panelRef.current) {
        previousActions = new Set();
        return;
      }
      const actions = gamepadActions(gamepad.buttons, gamepad.axes);
      actions.forEach((action) => {
        if (previousActions.has(action)) return;
        const direction = inputActionToDirection(action);
        if (direction) {
          const controls = focusableElements(panelRef.current);
          const current = controls.indexOf(document.activeElement as HTMLElement);
          const delta = direction === 'up' || direction === 'left' ? -1 : 1;
          const next = current < 0
            ? 0
            : (current + delta + controls.length) % controls.length;
          controls[next]?.focus();
        } else if (action === 'confirm' || action === 'interact') {
          (document.activeElement as HTMLElement | null)?.click();
        } else if (action === 'cancel' || action === 'menu') {
          onClose();
        }
      });
      previousActions = new Set(actions);
    });
  }, [onClose]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = focusableElements(panelRef.current);
    if (controls.length === 0) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="journey-overlay-backdrop"
      data-testid={`journey-overlay-${workspace}`}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panelRef}
        className={`journey-overlay journey-overlay-${workspace}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`journey-overlay-title-${workspace}`}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <header className="journey-overlay-header">
          <div>
            <small>JOURNEY WORKSPACE</small>
            <h2 id={`journey-overlay-title-${workspace}`}>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`}>
            CLOSE
          </button>
        </header>
        <div className="journey-overlay-content">{children}</div>
      </section>
    </div>
  );
}
