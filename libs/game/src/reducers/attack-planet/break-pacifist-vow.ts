import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import { PACIFIST_DEF_BONUS, PACIFIST_INFLUENCE } from '../../config/constants';
import { emitEffect } from '../../functions/emit-effect';
import { getOwnedPlanets } from '../../functions/get-owned-planets';
import { log } from '../../functions/log';
import type { GameState } from '../../interfaces/game-state';
import { chain } from '../../utils/chain';

export const breakPacifistVow = (state: GameState, attackerId: number): void =>
  match(state.players[attackerId].hasPacifistStatus)
    .with(
      true,
      () =>
        void chain(
          assign(state.players[attackerId], {
            hasPacifistStatus: false,
            hasForfeitedPacifism: true,
          }),
        )
          .thru(() =>
            assign(
              state,
              log(
                state,
                `⚔️ ${state.players[attackerId].name} breaks their pacifist vow to strike — the +${PACIFIST_DEF_BONUS} defense and +${PACIFIST_INFLUENCE}⭐ per planet are g1 for good.`,
                'war',
              ),
            ),
          )
          .tap(() =>
            getOwnedPlanets(state, state.players[attackerId]).forEach(
              (planet) =>
                assign(
                  state,
                  emitEffect(state, {
                    kind: 'floatText',
                    planetId: planet.id,
                    text: '⚔️ VOW BROKEN',
                    color: '#ff6b6b',
                  }),
                ),
            ),
          )
          .value(),
    )
    .otherwise(noop);
