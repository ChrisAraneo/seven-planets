import { cloneDeep } from 'lodash-es';
import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { markRandomAiAsKamikaze } from './mark-random-ai-as-kamikaze';
import { updatePlayers } from './update-players';

export const assignKamikazes = (state: GameState, count: number): GameState =>
  chain(
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
