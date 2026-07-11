import { chain, cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';
import { shuffleArray } from '../config/constants';
import type { GameState } from '../interfaces/game-state';

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
          (n) => n <= 0,
          () => cleared,
        )
        .otherwise((n) => markRandomAiAsKamikaze(cleared, n)),
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
            (p) => chosen.has(p.id),
            (p) => ({ ...p, isKamikaze: true }),
          )
          .otherwise((p) => p),
      ),
    )
    .value();
}
