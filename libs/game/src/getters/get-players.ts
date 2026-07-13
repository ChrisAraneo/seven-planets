import type { Player } from '../interfaces/player';
import { getGameState } from '../state';

export function getPlayers(): readonly Player[] {
  return getGameState().players;
}
