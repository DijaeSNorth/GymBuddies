import type { JourneyWorkspaceId, OpenJourneyWorkspace } from './workspaceTypes';

type QuickNavigationProps = Readonly<{
  activeWorkspace: JourneyWorkspaceId;
  openWorkspace: OpenJourneyWorkspace;
}>;

const ITEMS: ReadonlyArray<{
  id: JourneyWorkspaceId;
  label: string;
  shortcut?: string;
}> = [
  { id: 'play', label: 'Play' },
  { id: 'map', label: 'Map', shortcut: 'M' },
  { id: 'team', label: 'Team', shortcut: 'T' },
  { id: 'buddy-index', label: 'Index', shortcut: 'I' },
  { id: 'settings', label: 'Settings' },
];

export function QuickNavigation({
  activeWorkspace,
  openWorkspace,
}: QuickNavigationProps) {
  return (
    <nav className="journey-quick-nav" aria-label="Journey navigation">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          data-testid={`journey-nav-${item.id}`}
          className={activeWorkspace === item.id ? 'active' : ''}
          aria-current={activeWorkspace === item.id ? 'page' : undefined}
          aria-keyshortcuts={item.shortcut}
          onClick={() => openWorkspace(item.id)}
        >
          <span>{item.label}</span>
          {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
        </button>
      ))}
    </nav>
  );
}
