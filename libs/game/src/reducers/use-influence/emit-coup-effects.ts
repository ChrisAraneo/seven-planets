import { assign } from 'lodash-es';

import { emitEffect } from '../../functions/emit-effect';
import type { GameState } from '../../interfaces/game-state';
import type { Planet } from '../../interfaces/planet';
import { chain } from '../../utils/chain';

export const emitCoupEffects = (state: GameState, planet: Planet): void =>
  void chain(state)
    .tap(() =>
      assign(state, emitEffect(state, { kind: 'boom', planetId: planet.id })),
    )
    .tap(() =>
      assign(
        state,
        emitEffect(state, {
          kind: 'floatText',
          planetId: planet.id,
          text: '👑 COUP!',
          color: '#ffb0d8',
        }),
      ),
    )
    .value();
