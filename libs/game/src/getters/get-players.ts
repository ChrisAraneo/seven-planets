import { getGameStateLastValue } from '../get-game-state-last-value';
import type { Player } from '../interfaces/player';

export const getPlayers = (): readonly Player[] =>
  getGameStateLastValue().players;
