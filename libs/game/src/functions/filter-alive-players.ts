import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

export function filterAlivePlayers(state: GameState): Player[] {
  return state.players.filter((player) => player.isAlive);
}
