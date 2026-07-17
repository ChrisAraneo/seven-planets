import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

// Copy-on-write: return a new state whose player `id` is replaced by `fn(player)`.
// Every other player, and the rest of the state tree, is shared by reference.
// Engine hot path.
export function updatePlayer(
  state: GameState,
  id: number,
  callback: (player: Player) => Player,
): GameState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === id ? callback(player) : player,
    ),
  };
}
