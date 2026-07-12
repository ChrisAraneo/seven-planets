import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

export function updatePlayers(
  state: GameState,
  callback: (player: Player) => Player,
): GameState {
  return { ...state, players: state.players.map(callback) };
}
