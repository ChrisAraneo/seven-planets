import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

export const updatePlayer = (
  state: GameState,
  id: number,
  callback: (player: Player) => Player,
): GameState => ({
  ...state,
  players: state.players.map((player) =>
    (player.id === id ? callback(player) : player),
  ),
});
