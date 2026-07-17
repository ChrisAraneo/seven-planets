import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

export const updatePlayers = (
  state: GameState,
  callback: (player: Player) => Player,
): GameState => ({
  ...state,
  players: state.players.map((player) => callback(player)),
});
