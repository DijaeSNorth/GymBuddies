import {
  useEffect,
  useRef,
  useState,
} from 'react';

type JourneyClockOptions = Readonly<{
  active: boolean;
  paused: boolean;
  intervalMs?: number;
  onAdvance: (elapsedMs: number) => void;
}>;

export function useJourneyClock({
  active,
  paused,
  intervalMs = 1_000,
  onAdvance,
}: JourneyClockOptions) {
  const [tick, setTick] = useState(() => Date.now());
  const pausedRef = useRef(paused);
  const onAdvanceRef = useRef(onAdvance);

  pausedRef.current = paused;
  onAdvanceRef.current = onAdvance;

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      if (
        pausedRef.current ||
        document.visibilityState !== 'visible'
      ) {
        return;
      }
      setTick(Date.now());
      onAdvanceRef.current(intervalMs);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [active, intervalMs]);

  return tick;
}
