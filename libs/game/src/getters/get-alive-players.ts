import { getGameStateLastValue } from '@seven-planets/game';
import type { Player } from '@seven-planets/game';

export function getAlivePlayers(): Player[] {
  return getGameStateLastValue().players.filter((player) => player.isAlive);
}
