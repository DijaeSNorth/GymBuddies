import { describe, expect, it } from 'vitest';

import {
  updateJourneyOverlay,
  type JourneyOverlay,
} from '../ui/journey/hooks/useJourneyOverlays';

describe('journey architecture state', () => {
  it('keeps mutually exclusive journey overlays explicit', () => {
    let overlay: JourneyOverlay = { type: 'none' };
    overlay = updateJourneyOverlay(
      overlay,
      'buddy-customizer',
      true,
    );
    expect(overlay).toEqual({ type: 'buddy-customizer' });

    overlay = updateJourneyOverlay(
      overlay,
      'physique-review',
      true,
    );
    expect(overlay).toEqual({ type: 'physique-review' });

    overlay = updateJourneyOverlay(
      overlay,
      'physique-review',
      false,
    );
    expect(overlay).toEqual({ type: 'none' });
  });

  it('does not close another overlay through a stale close action', () => {
    const overlay: JourneyOverlay = { type: 'physique-review' };
    expect(
      updateJourneyOverlay(
        overlay,
        'buddy-customizer',
        false,
      ),
    ).toEqual(overlay);
  });
});
