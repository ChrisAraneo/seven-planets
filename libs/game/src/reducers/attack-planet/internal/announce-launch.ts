import { assign, chain } from 'lodash-es';

import { emitEffect } from '../../../functions/emit-effect';
import { log } from '../../../functions/log';
import type { GameState } from '../../../interfaces/game-state';

export const announceLaunch = (
  state: GameState,
  attackerId: number,
  sourceId: number,
  targetId: number,
  troops: number,
): void =>
  void chain(state)
    .tap(() =>
      assign(
        state,
        log(
          state,
          `🚀 ${state.players[attackerId].name} launches a rocket with ${troops} troops from ${state.planets[sourceId].name} at ${state.planets[targetId].name} (${state.players[state.planets[targetId].ownerId].name})!`,
          'war',
        ),
      ),
    )
    .tap(() =>
      assign(
        state,
        emitEffect(state, {
          kind: 'rocket',
          fromId: sourceId,
          toId: targetId,
          color: state.players[attackerId].color,
        }),
      ),
    )
    .value();
