import type { Player } from '../interfaces/player';
import { getGameStateLastValue } from '../state';

export function getPlayers(): readonly Player[] {
  return getGameStateLastValue().players;
}
