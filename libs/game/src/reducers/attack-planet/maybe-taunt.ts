import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import { TAUNTS } from '../../config/constants';
import { choice } from '../../functions/choice';
import { log } from '../../functions/log';
import type { GameState } from '../../interfaces/game-state';

const TAUNT_CHANCE = 0.4;
export const maybeTaunt = (state: GameState, attackerId: number): void =>
  match(!state.players[attackerId].isHuman && Math.random() < TAUNT_CHANCE)
    .with(
      true,
      () =>
        void assign(
          state,
          log(
            state,
            `   ${state.players[attackerId].name}: ${choice(TAUNTS)}`,
            'war',
          ),
        ),
    )
    .otherwise(noop);
