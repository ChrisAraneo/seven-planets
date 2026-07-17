import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import { log } from './log';
import { setStatus } from './set-status';

/* Nothing in the pool is pickable for this slot: log a pass (and tell the
   human why) — the draft moves straight on without parking. */
export function passSlot(
  state: GameState,
  player: Player,
  planet: Planet,
  isHumanControlled: boolean,
): void {
  return chain(state)
    .tap(() =>
      match(isHumanControlled)
        .with(
          true,
          () =>
            void assign(
              state,
              setStatus(state, `No card you can take — ${planet.name} passes.`),
            ),
        )
        .otherwise(noop),
    )
    .tap(() =>
      assign(
        state,
        log(
          state,
          `🃏 ${player.name} passes (nothing pickable for ${planet.name})`,
          'draft',
        ),
      ),
    )
    .thru(noop)
    .value();
}
