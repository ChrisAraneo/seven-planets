import { assign, chain, cloneDeep, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import type { GameState } from '../../interfaces/game-state';
import { emitEffect } from '../../functions/emit-effect';
import { hasActionCard } from '../../functions/has-action-card';
import { recruitCost } from '../../functions/recruit-cost';
import { canAfford } from '../../config/constants';
import { recruitYield } from '../../functions/recruit-yield';
import { log } from '../../functions/log';
import { payCost } from '../../functions/pay-cost';
import { pluralSuffix } from '../../functions/plural-suffix';
import { spendActionCard } from '../../functions/spend-action-card';
import type { RecruitTroopsPayload } from '../../actions/recruit-troops/recruit-troops';

/* Reducer branch. Resolves the recruitment on a private clone; illegal
   intents reduce to the unchanged state. */
export function applyRecruitTroops(
  state: GameState,
  payload: RecruitTroopsPayload,
): GameState {
  return match(state)
    .when(
      (state) => payload.playerId !== state.activeId || Boolean(state.over),
      (state) => state,
    )
    .when(
      (state) => !hasActionCard(state.players[payload.playerId], 'RECRUIT'),
      (state) => state,
    )
    .otherwise((state) =>
      chain(cloneDeep(state))
        .tap((clone) =>
          executeRecruit(clone, payload.playerId, payload.planetId),
        )
        .value(),
    );
}

// Applies pure engine results onto the private clone via assign so the
// object identity (and the caller's `state` reference) stays stable.
function executeRecruit(
  state: GameState,
  playerId: number,
  planetId: number,
): void {
  return match(state.planets[planetId])
    .when((planet) => !planet.buildings.BARRACKS, noop)
    .when(
      (planet) => !canAfford(state.players[playerId].hand, recruitCost(planet)),
      noop,
    )
    .otherwise(
      (planet) =>
        void chain(assign(state, spendActionCard(state, playerId, 'RECRUIT')))
          .thru((state) =>
            assign(state, payCost(state, playerId, recruitCost(planet))),
          )
          .thru((state) => ({ s: state, n: recruitYield(planet) }))
          .tap(({ s: state, n: count }) =>
            assign(state.planets[planetId], {
              troops: state.planets[planetId].troops + count,
            }),
          )
          .tap(({ s: state, n: count }) =>
            assign(
              state,
              log(
                state,
                `🪖 ${state.players[playerId].name} recruits ${count} troop${pluralSuffix(count)} on ${planet.name} (garrison now ${state.planets[planetId].troops})`,
                'build',
              ),
            ),
          )
          .tap(({ s: state, n: count }) =>
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
}
