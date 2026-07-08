import { mastermindEvaluateTrade } from '@/game/ai/functions/mastermind-evaluate-trade';
import { RESOURCE_TYPES } from '@/game/constants';
import type { Cost, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

// Ai = the player being ASKED to accept. gives/gets are from ai's perspective.
export function aiEvaluateTrade(
  ai: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null = null,
): boolean {
  const state = getGameState();
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
  return mastermindEvaluateTrade(ai, gives, gets, proposer);
}
