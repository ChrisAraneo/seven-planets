import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { PEACE_TRUCE } from '../../config/constants';
import { getOwnedPlanets } from '../../functions/extractors/get-owned-planets';
import { log } from '../../functions/log';
import type { GameState } from '../../interfaces/game-state';
import type { InfluenceType } from '../../interfaces/influence-type';
import { chain } from '../../utils/chain';
import { logPlay } from './log-play';
import { spendInfluenceCard } from './spend-influence-card';

export const playPeace = (
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
): boolean =>
  chain(state)
    .tap(() => spendInfluenceCard(state, playerId, influenceType))
    .tap(() => logPlay(state, playerId, influenceType, 'sys'))
    .tap(() =>
      getOwnedPlanets(state, state.players[playerId]).forEach((planet) =>
        assign(planet, {
          protectedUntil: Math.max(
            planet.protectedUntil,
            state.turn + PEACE_TRUCE,
          ),
        }),
      ),
    )
    .tap(() =>
      assign(
        state,
        log(
          state,
          `🕊️ ${state.players[playerId].name}'s planets are under truce for ${PEACE_TRUCE} turn${match(
            PEACE_TRUCE,
          )
            .with(1, () => '')
            .otherwise(() => 's')} — no attacks allowed!`,
          'sys',
        ),
      ),
    )
    .thru(() => true)
    .value();
