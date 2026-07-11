import type { Player } from '../interfaces/player';
import { getGameState } from '../game-state';

export function getPlayers(): readonly Player[] {
  return getGameState().players;
}
