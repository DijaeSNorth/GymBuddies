import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

export type JourneyOverlay =
  | { type: 'none' }
  | { type: 'buddy-customizer' }
  | { type: 'physique-review' };

function resolveBooleanUpdate(
  current: boolean,
  update: SetStateAction<boolean>,
) {
  return typeof update === 'function' ? update(current) : update;
}

export function updateJourneyOverlay(
  current: JourneyOverlay,
  type: Exclude<JourneyOverlay['type'], 'none'>,
  nextOpen: boolean,
): JourneyOverlay {
  const currentOpen = current.type === type;
  if (nextOpen) return { type };
  return currentOpen ? { type: 'none' } : current;
}

export function useJourneyOverlays() {
  const [overlay, setOverlay] = useState<JourneyOverlay>({
    type: 'none',
  });
  const buddyCustomizationOpen =
    overlay.type === 'buddy-customizer';
  const physiqueReviewOpen = overlay.type === 'physique-review';

  const setBuddyCustomizationOpen: Dispatch<
    SetStateAction<boolean>
  > = useCallback((update) => {
    setOverlay((current) => {
      const currentOpen = current.type === 'buddy-customizer';
      const nextOpen = resolveBooleanUpdate(currentOpen, update);
      return updateJourneyOverlay(
        current,
        'buddy-customizer',
        nextOpen,
      );
    });
  }, []);

  const setPhysiqueReviewOpen: Dispatch<
    SetStateAction<boolean>
  > = useCallback((update) => {
    setOverlay((current) => {
      const currentOpen = current.type === 'physique-review';
      const nextOpen = resolveBooleanUpdate(currentOpen, update);
      return updateJourneyOverlay(
        current,
        'physique-review',
        nextOpen,
      );
    });
  }, []);

  return {
    overlay,
    buddyCustomizationOpen,
    physiqueReviewOpen,
    setBuddyCustomizationOpen,
    setPhysiqueReviewOpen,
  } as const;
}
