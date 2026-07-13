import { RESOURCE_TYPES } from '@seven-planets/game';
import type { Cost, Player } from '@seven-planets/game';

import { shouldMastermindAcceptTrade } from './should-mastermind-accept-trade';

// Should this AI accept an incoming trade offer? `ai` is the player being
// ASKED to accept; gives/gets are from ai's perspective. Sanity-checks the
// Offer (resource cards only, ai can pay) before consulting the judgment.
export function shouldAcceptTrade(
  ai: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null = null,
): boolean {
  // Only resource cards may be traded
  for (const type in gives) {
    if (!RESOURCE_TYPES.includes(type as never) && (gives[type] || 0) > 0) {
      return false;
    }
  }
  for (const eachType in gets) {
    if (
      !RESOURCE_TYPES.includes(eachType as never) &&
      (gets[eachType] || 0) > 0
    ) {
      return false;
    }
  }
  for (const innerType in gives) {
    if ((ai.hand[innerType] || 0) < gives[innerType]) {
      return false;
    }
  }
  return shouldMastermindAcceptTrade(ai, gives, gets, proposer);
}
