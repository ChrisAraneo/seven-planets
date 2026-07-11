import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

export function updatePlayers(
  state: GameState,
  fn: (player: Player) => Player,
): GameState {
  return { ...state, players: state.players.map(fn) };
}
