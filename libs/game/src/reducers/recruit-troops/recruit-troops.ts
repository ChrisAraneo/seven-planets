import { assign, cloneDeep, noop } from 'lodash-es';
import { chain } from '../../utils/chain';
import { match } from 'ts-pattern';
import type { GameState } from '../../interfaces/game-state';
import type { Planet } from '../../interfaces/planet';
import { emitEffect } from '../../functions/emit-effect';
import { hasActionCard } from '../../functions/has-action-card';
import { computeRecruitableTroops } from '../../functions/compute-recruitable-troops';
import { computeRecruitYield } from '../../functions/compute-recruit-yield';
import { log } from '../../functions/log';
import { payCost } from '../../functions/pay-cost';
import { getPluralSuffix } from '../../functions/get-plural-suffix';
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
      // Not a single troop payable (1⛏️ each, relics stand in): no-op.
      (planet) =>
        computeRecruitableTroops(planet, state.players[playerId].hand) < 1,
      noop,
    )
    .otherwise(
      (planet) =>
        // Short on Ore, the Barracks still musters what the hand CAN pay.
        void chain(
          computeRecruitableTroops(planet, state.players[playerId].hand),
        )
          .thru((count) => ({
            s: assign(state, spendActionCard(state, playerId, 'RECRUIT')),
            n: count,
          }))
          .thru(({ s: state, n: count }) => ({
            s: assign(state, payCost(state, playerId, { ORE: count })),
            n: count,
          }))
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
                `🪖 ${state.players[playerId].name} recruits ${count} troop${getPluralSuffix(count)}${getOreLimitedSuffix(planet, count)} on ${planet.name} (garrison now ${state.planets[planetId].troops})`,
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

// "(ore-limited, Barracks yields 4)" when the hand couldn't pay the full yield.
function getOreLimitedSuffix(planet: Planet, count: number): string {
  return match(count < computeRecruitYield(planet))
    .with(
      true,
      () => ` (ore-limited, Barracks yields ${computeRecruitYield(planet)})`,
    )
    .otherwise(() => '');
}
