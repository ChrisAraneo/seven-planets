import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { getRemainingSkipsSuffix } from './get-remaining-skips-suffix';
import { log } from './log';

export const logParalysis = (state: GameState, player: Player): void =>
  match(player)
    .when(() => !player.isAlive, noop)
    .otherwise(
      () =>
        void assign(
          state,
          log(
            state,
            `⏭️ ${player.name} is paralysed and sits this turn out${getRemainingSkipsSuffix(player.skipTurns)}`,
            'sys',
          ),
        ),
    );
