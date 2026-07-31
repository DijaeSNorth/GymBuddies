import type { JourneyGameProps } from './journeyTypes';
import { JourneyShell } from './JourneyShell';
import { useJourneyController } from './useJourneyController';
import './journey.css';

export function JourneyGame(props: JourneyGameProps) {
  if (
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') ===
      'journey-error'
  ) {
    throw new Error('Intentional development journey boundary check.');
  }
  const controller = useJourneyController(props);
  return props.active ? (
    <JourneyShell controller={controller} />
  ) : null;
}
