import { assign } from 'lodash-es';

import { CONQUEST_TRUCE } from '../../config/constants';
import { checkWin } from '../../functions/check-win';
import { emitEffect } from '../../functions/emit-effect';
import { log } from '../../functions/log';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';
import { resolveDefenderFate } from './resolve-defender-fate';

export const conquerPlanet = (
  state: GameState,
  attackerId: number,
  targetId: number,
  garrison: number,
): void =>
  void chain({
    target: state.planets[targetId],
    defenderId: state.planets[targetId].ownerId,
  })
    .tap(({ target }) =>
      assign(target, {
        ownerId: attackerId,
        troops: garrison,
        protectedUntil: state.turn + CONQUEST_TRUCE,
      }),
    )
    .tap(() =>
      assign(
        state,
        emitEffect(state, {
          kind: 'floatText',
          planetId: targetId,
          text: 'CONQUERED!',
          color: '#ff9e3d',
        }),
      ),
    )
    .tap(({ target }) =>
      assign(
        state,
        log(
          state,
          `🏴 ${state.players[attackerId].name} CONQUERS ${target.name} — ${garrison}🪖 garrison it! Under truce for ${CONQUEST_TRUCE} turns.`,
          'war',
        ),
      ),
    )
    .tap(({ defenderId }) => resolveDefenderFate(state, attackerId, defenderId))
    .thru(() => assign(state, checkWin(state)))
    .value();
