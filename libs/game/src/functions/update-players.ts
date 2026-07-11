import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

// Copy-on-write whole-roster pass: return a new state whose players are each
// mapped through `fn`. Used by functions that touch every player (income,
// pacifist promotion, kamikaze assignment).
export function updatePlayers(
  state: GameState,
  fn: (player: Player) => Player,
): GameState {
  return { ...state, players: state.players.map(fn) };
}
