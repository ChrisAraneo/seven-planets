import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { shuffleArray } from './shuffle-array';
import { updatePlayers } from './update-players';

export const markRandomAiAsKamikaze = (
  state: GameState,
  count: number,
): GameState =>
  chain(
    shuffleArray(
      state.players.filter((player) => !player.isHuman && player.isAlive),
    ),
  )
    .thru(
      (aliveAiPlayers) =>
        new Set(aliveAiPlayers.slice(0, count).map((player) => player.id)),
    )
    .thru((chosen) =>
      updatePlayers(state, (player) =>
        match(player)
          .when(
            () => chosen.has(player.id),
            () => ({ ...player, isKamikaze: true }),
          )
          .otherwise(() => player),
      ),
    )
    .value();
