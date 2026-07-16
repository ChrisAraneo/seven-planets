import { RESOURCE_TYPES } from '@seven-planets/game';
import type { Cost, Player } from '@seven-planets/game';

import { shouldMastermindAcceptTrade } from './should-mastermind-accept-trade';

// Should this AI accept an incoming trade offer? `aiPlayer` is the player being
// ASKED to accept; gives/gets are from its perspective. Sanity-checks the
// offer (resource cards only, the AI can pay) before consulting the judgment.
export function shouldAcceptTrade(
  aiPlayer: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null = null,
): boolean {
  // Only resource cards may be traded.
  for (const resourceType in gives) {
    if (
      !RESOURCE_TYPES.includes(resourceType as never) &&
      (gives[resourceType] || 0) > 0
    ) {
      return false;
    }
  }
  for (const resourceType in gets) {
    if (
      !RESOURCE_TYPES.includes(resourceType as never) &&
      (gets[resourceType] || 0) > 0
    ) {
      return false;
    }
  }
  for (const resourceType in gives) {
    if ((aiPlayer.hand[resourceType] || 0) < gives[resourceType]) {
      return false;
    }
  }
  return shouldMastermindAcceptTrade(aiPlayer, gives, gets, proposer);
}
