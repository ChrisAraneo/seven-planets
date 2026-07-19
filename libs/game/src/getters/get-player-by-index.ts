import { getGameStateLastValue } from '../get-game-state-last-value';
import type { Player } from '../interfaces/player';

export const getPlayerByIndex = (index: number): Player | undefined =>
  getGameStateLastValue().players.find((player) => player.id === index);
