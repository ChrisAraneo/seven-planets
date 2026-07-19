import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

export const updatePlayer = (
  state: GameState,
  id: number,
  callback: (player: Player) => Player,
): GameState => ({
  ...state,
  players: state.players.map((player) =>
    match(player)
      .when((candidate) => candidate.id === id, callback)
      .otherwise(() => player),
  ),
});
