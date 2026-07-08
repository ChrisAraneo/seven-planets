// NOTE: This function is not used anywhere in the current codebase.
// It was part of the old non-mastermind AI personality system.
import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

// Desired garrison per planet for the mastermind AI.
export function troopTarget(p: Player): number {
  const state = getGameState();
  return 2 + Math.min(8, Math.floor(state.turn / 3)) + 2;
}
