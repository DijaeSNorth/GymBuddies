import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

type TrainerStudioDrawerProps = Readonly<{
  children: ReactNode;
  onClose: () => void;
  title: string;
}>;

function focusable(container: HTMLElement | null) {
  return Array.from(
    container?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  ).filter((element) => element.offsetParent !== null);
}
export function TrainerStudioDrawer({ children, onClose, title }: TrainerStudioDrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    window.requestAnimationFrame(() => (focusable(panelRef.current)[0] ?? panelRef.current)?.focus());
    return () => restoreRef.current?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = focusable(panelRef.current);
    if (!controls.length) return;
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <div className="trainer-studio-drawer-backdrop" onPointerDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        ref={panelRef}
        className="trainer-studio-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trainer-studio-drawer-title"
        onKeyDown={onKeyDown}
        tabIndex={-1}
      >
        <header>
          <div><small>TRAINER FORGE TOOL</small><h2 id="trainer-studio-drawer-title">{title}</h2></div>
          <button type="button" data-setup-control="true" onClick={onClose} aria-label={`Close ${title}`}>Close</button>
        </header>
        <div className="trainer-studio-drawer-content">{children}</div>
      </section>
    </div>
  );
}
