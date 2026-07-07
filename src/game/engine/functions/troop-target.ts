// NOTE: This function is not used anywhere in the current codebase.
// It was part of the old non-mastermind AI personality system.
import type { Player } from '@/game/types';
import { getState } from '../state';

// Desired garrison per planet for the mastermind AI.
export function troopTarget(p: Player): number {
  return 2 + Math.min(8, Math.floor(getState().turn / 3)) + 2;
}
