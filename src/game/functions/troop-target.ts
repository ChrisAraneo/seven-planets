// NOTE: This function is not used anywhere in the current codebase.
// It was part of the old non-mastermind AI personality system.
import { getTurn } from '@/game/getters/get-turn';
import type { Player } from '@/game/types';

// Desired garrison per planet for the mastermind AI.
export function troopTarget(p: Player): number {
  return 2 + Math.min(8, Math.floor(getTurn() / 3)) + 2;
}
