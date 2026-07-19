import type { Player } from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';

export const getAlivePlayers = (): Player[] =>
  getGameStateLastValue().players.filter((player) => player.isAlive);
