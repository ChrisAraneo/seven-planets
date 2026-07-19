import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import { logParalysis } from './log-paralysis';

export const tickSkipTurns = (state: GameState, player: Player): void =>
  match(player)
    .when(() => player.skipTurns <= 0, noop)
    .otherwise(() =>
      chain(assign(player, { skipTurns: player.skipTurns - 1 }))
        .thru((ticked) => logParalysis(state, ticked))
        .value(),
    );
