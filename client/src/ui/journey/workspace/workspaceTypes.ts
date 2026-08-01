export type JourneyWorkspaceId =
  | 'play'
  | 'map'
  | 'team'
  | 'training'
  | 'buddy-index'
  | 'physique'
  | 'inventory'
  | 'settings'
  | 'save'
  | 'playtest'
  | 'system';

export type OpenJourneyWorkspace = (workspace: JourneyWorkspaceId) => void;
