import { assign, noop } from 'lodash-es';
import { match } from 'ts-pattern';

import { computeRecruitableTroops } from '../../../functions/compute-recruitable-troops';
import { createPluralSuffixString } from '../../../functions/create-plural-suffix-string';
import { emitEffect } from '../../../functions/emit-effect';
import { log } from '../../../functions/log';
import { payCost } from '../../../functions/pay-cost';
import { spendActionCard } from '../../../functions/spend-action-card';
import type { GameState } from '../../../interfaces/game-state';
import { chain } from '../../../utils/chain';
import { createOreLimitedSuffixString } from './create-ore-limited-suffix-string';

export const executeRecruit = (
  state: GameState,
  playerId: number,
  planetId: number,
): void =>
  match(state.planets[planetId])
    .when((planet) => !planet.buildings.BARRACKS, noop)
    .when(
      (planet) =>
        computeRecruitableTroops(planet, state.players[playerId].hand) < 1,
      noop,
    )
    .otherwise(
      (planet) =>
        void chain(
          computeRecruitableTroops(planet, state.players[playerId].hand),
        )
          .tap(() => assign(state, spendActionCard(state, playerId, 'RECRUIT')))
          .tap((count) =>
            assign(state, payCost(state, playerId, { ORE: count })),
          )
          .tap((count) =>
            assign(state.planets[planetId], {
              troops: state.planets[planetId].troops + count,
            }),
          )
          .tap((count) =>
            assign(
              state,
              log(
                state,
                `🪖 ${state.players[playerId].name} recruits ${count} troop${createPluralSuffixString(count)}${createOreLimitedSuffixString(planet, count)} on ${planet.name} (garrison now ${state.planets[planetId].troops})`,
                'build',
              ),
            ),
          )
          .tap((count) =>
            assign(
              state,
              emitEffect(state, {
                kind: 'floatText',
                planetId,
                text: `+${count}🪖`,
                color: '#7fd9ff',
              }),
            ),
          )
          .value(),
    );
