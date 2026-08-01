import { Suspense } from 'react';

import type { JourneyController } from '../../JourneyShell';

type BuddyIndexWorkspaceProps = Readonly<{
  controller: JourneyController;
}>;

export function BuddyIndexWorkspace({ controller }: BuddyIndexWorkspaceProps) {
  return (
    <Suspense fallback={<p role="status">Loading Buddy Index...</p>}>
      <controller.LazyBuddyIndex
        species={controller.CREATURES}
        seenDex={controller.save.seenDex}
        caughtDex={controller.save.caughtDex}
      />
    </Suspense>
  );
}
