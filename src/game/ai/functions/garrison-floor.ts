import type { GameState } from '@/game/types';

export function garrisonFloor(s: GameState): number {
  return 2 + Math.min(8, Math.floor(s.turn / 4));
}
