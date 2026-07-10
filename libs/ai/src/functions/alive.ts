import { getGameState } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

export function alive(): Player[] {
  return getGameState().players.filter((p) => p.alive);
}
