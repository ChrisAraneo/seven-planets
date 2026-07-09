import { RESOURCE_TYPES } from '@/game/constants';
import type { Cost, Player } from '@/game/types';

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
  for (const t in gives) {
    if (!RESOURCE_TYPES.includes(t as never) && (gives[t] || 0) > 0) {
      return false;
    }
  }
  for (const t in gets) {
    if (!RESOURCE_TYPES.includes(t as never) && (gets[t] || 0) > 0) {
      return false;
    }
  }
  for (const t in gives) {
    if ((ai.hand[t] || 0) < gives[t]) {
      return false;
    }
  }
  return shouldMastermindAcceptTrade(ai, gives, gets, proposer);
}
