import { mastermindEvaluateTrade } from '@/game/ai/functions/mastermind-evaluate-trade';
import { RESOURCE_TYPES } from '@/game/constants';
import type { Cost, GameState, Player } from '@/game/types';

// Ai = the player being ASKED to accept. gives/gets are from ai's perspective.
export function aiEvaluateTrade(
  state: GameState,
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
  return mastermindEvaluateTrade(state, ai, gives, gets, proposer);
}
