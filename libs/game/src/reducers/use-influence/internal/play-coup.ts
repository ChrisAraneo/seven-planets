import { assign } from 'lodash-es';
import { match } from 'ts-pattern';

import { CONQUEST_TRUCE } from '../../../config/constants';
import { getCoupTargets } from '../../../functions/extractors/get-coup-targets';
import { log } from '../../../functions/log';
import type { GameState } from '../../../interfaces/game-state';
import type { InfluenceOptions } from '../../../interfaces/influence-options';
import type { InfluenceType } from '../../../interfaces/influence-type';
import { chain } from '../../../utils/chain';
import { nullish } from '../../../utils/p';
import { emitCoupEffects } from './emit-coup-effects';
import { logPlay } from './log-play';
import { maybeToppleRegime } from './maybe-topple-regime';
import { spendInfluenceCard } from './spend-influence-card';

export const playCoup = (
  state: GameState,
  playerId: number,
  influenceType: InfluenceType,
  options: InfluenceOptions,
): boolean =>
  match(options.planet && state.planets[options.planet.id])
    .with(nullish, () => false)
    .when(
      (planet) =>
        !getCoupTargets(state, state.players[playerId]).includes(planet),
      () => false,
    )
    .otherwise((planet) =>
      chain({ defId: planet.ownerId })
        .tap(() => spendInfluenceCard(state, playerId, influenceType))
        .tap(() => logPlay(state, playerId, influenceType, 'sys'))
        .tap(() =>
          assign(planet, {
            ownerId: playerId,
            troops: Math.max(1, Math.floor(planet.troops / 2)),
            protectedUntil: state.turn + CONQUEST_TRUCE,
          }),
        )
        .tap(() => emitCoupEffects(state, planet))
        .tap(({ defId }) =>
          assign(
            state,
            log(
              state,
              `👑 ${planet.name} defects to ${state.players[playerId].name} — half of ${state.players[defId].name}'s garrison disbands, ${planet.troops}🪖 defect! Under truce for ${CONQUEST_TRUCE} turns.`,
              'war',
            ),
          ),
        )
        .tap(({ defId }) => maybeToppleRegime(state, playerId, defId))
        .thru(() => true)
        .value(),
    );
