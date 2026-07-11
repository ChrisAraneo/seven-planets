import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

// Copy-on-write: return a new state whose player `id` is replaced by `fn(player)`.
// Every other player, and the rest of the state tree, is shared by reference.
// Short-circuit expression (fn always returns an object): engine hot path.
export function updatePlayer(
  state: GameState,
  id: number,
  fn: (player: Player) => Player,
): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === id && fn(p)) || p),
  };
}
