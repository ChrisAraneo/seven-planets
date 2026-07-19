import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

export const filterAlivePlayers = (state: GameState): Player[] =>
  state.players.filter((player) => player.isAlive);
