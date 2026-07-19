import { assign } from 'lodash-es';

import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import { tickSkipTurns } from './tick-skip-turns';

export const beginPlayerTurn = (state: GameState, player: Player): void =>
  chain(
    assign(player, {
      hasTradedCurrentTurn: false,
      isSkippedNow: player.isAlive && player.skipTurns > 0,
    }),
  )
    .thru(() => tickSkipTurns(state, player))
    .value();
