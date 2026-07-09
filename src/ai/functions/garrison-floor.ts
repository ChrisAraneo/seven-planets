import { getGameState } from '@/stores/game-state';

export function garrisonFloor(): number {
  const s = getGameState();
  return 2 + Math.min(8, Math.floor(s.turn / 4));
}
