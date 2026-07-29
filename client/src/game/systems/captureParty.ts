import type { Buddy } from '../types';

export type CapturePartyPlacement =
  | {
      kind: 'added';
      team: Buddy[];
      pendingBuddy: null;
    }
  | {
      kind: 'full-party';
      team: Buddy[];
      pendingBuddy: Buddy;
    };

/** Adds a captured Buddy when space exists, otherwise returns a replacement decision. */
export function planCapturePartyPlacement(
  team: readonly Buddy[],
  capturedBuddy: Buddy,
  partyLimit: number,
): CapturePartyPlacement {
  if (team.length >= partyLimit) {
    return {
      kind: 'full-party',
      team: [...team],
      pendingBuddy: capturedBuddy,
    };
  }
  return {
    kind: 'added',
    team: [...team, capturedBuddy],
    pendingBuddy: null,
  };
}

/** Replaces one explicit party slot without mutating the existing team. */
export function replacePartyBuddy(
  team: readonly Buddy[],
  replacementIndex: number,
  capturedBuddy: Buddy,
): Buddy[] {
  if (
    !Number.isInteger(replacementIndex) ||
    replacementIndex < 0 ||
    replacementIndex >= team.length
  ) {
    throw new Error(`Invalid party replacement index "${replacementIndex}".`);
  }
  return team.map((buddy, index) =>
    index === replacementIndex ? capturedBuddy : buddy,
  );
}
