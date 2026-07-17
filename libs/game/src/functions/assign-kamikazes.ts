import { cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import { shuffleArray } from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { updatePlayers } from './update-players';

export function assignKamikazes(state: GameState, count: number): GameState {
  return chain(
    updatePlayers(cloneDeep(state), (player) => ({
      ...player,
      isKamikaze: false,
    })),
  )
    .thru((cleared) =>
      match(count)
        .when(
          () => count <= 0,
          () => cleared,
        )
        .otherwise(() => markRandomAiAsKamikaze(cleared, count)),
    )
    .value();
}

function markRandomAiAsKamikaze(state: GameState, count: number): GameState {
  return chain(
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
}
