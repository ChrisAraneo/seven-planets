import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import { CARD_TYPES, INFLUENCE_TYPES } from '../../../config/constants';
import { checkWin } from '../../../functions/check-win';
import { getOwnedPlanets } from '../../../functions/extractors/get-owned-planets';
import { log } from '../../../functions/log';
import type { GameState } from '../../../interfaces/game-state';
import { chain } from '../../../utils/chain';
import { lootToppledRegime } from './loot-toppled-regime';

export const maybeToppleRegime = (
  state: GameState,
  playerId: number,
  defId: number,
): void =>
  match(getOwnedPlanets(state, state.players[defId]).length)
    .when((owned) => owned > 0, noop)
    .otherwise(
      () =>
        void chain(state)
          .tap(() => lootToppledRegime(state, playerId, defId))
          .tap(() =>
            assign(state.players[defId], {
              hand: {
                ...state.players[defId].hand,
                ...Object.fromEntries(
                  [...CARD_TYPES, ...INFLUENCE_TYPES].map((cardType) => [
                    cardType,
                    0,
                  ]),
                ),
              },
              isAlive: false,
            }),
          )
          .tap(() =>
            assign(
              state,
              log(
                state,
                `☠️ ${state.players[defId].name} has been wiped from the galaxy — overthrown without a shot!`,
                'war',
              ),
            ),
          )
          .tap(() => assign(state, checkWin(state)))
          .value(),
    );
