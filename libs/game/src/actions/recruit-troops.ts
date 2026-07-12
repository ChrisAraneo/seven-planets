import { assign, chain, cloneDeep, noop } from 'lodash-es';
import { match } from 'ts-pattern';
import type { GameState } from '../interfaces/game-state';
import { hasActionCard } from '../functions/has-action-card';
import { recruitCost } from '../functions/recruit-cost';
import { canAfford, NO_PRESENTATION } from '../config/constants';
import { recruitYield } from '../functions/recruit-yield';
import { log } from '../functions/log';
import { payCost } from '../functions/pay-cost';
import { pluralSuffix } from '../functions/plural-suffix';
import { spendActionCard } from '../functions/spend-action-card';
import { getGameState, setGameState } from '../game-state';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

export interface RecruitTroopsPayload {
  playerId: number;
  planetId: number;
}

export async function recruitTroops(
  payload: RecruitTroopsPayload,
  hooks: PresentationHooks = NO_PRESENTATION,
): Promise<void> {
  return match(cloneDeep(getGameState()))
    .when(
      (state) => payload.playerId !== state.activeId || Boolean(state.over),
      noop,
    )
    .when(
      (state) => !hasActionCard(state.players[payload.playerId], 'RECRUIT'),
      noop,
    )
    .otherwise(
      (state) =>
        void chain(state)
          .tap((state) =>
            executeRecruit(state, payload.playerId, payload.planetId, hooks),
          )
          .tap((state) => setGameState(state))
          .value(),
    );
}

// Applies pure engine results onto the private clone via assign so the
// object identity (and the caller's `state` reference) stays stable.
function executeRecruit(
  state: GameState,
  playerId: number,
  planetId: number,
  hooks: PresentationHooks,
): void {
  return match(state.planets[planetId])
    .when((planet) => !planet.buildings.BARRACKS, noop)
    .when(
      (planet) => !canAfford(state.players[playerId].hand, recruitCost(planet)),
      noop,
    )
    .otherwise(
      (planet) =>
        void chain(
          assign(state, spendActionCard(state, playerId, 'RECRUIT')),
        )
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
            hooks.floatText(state.planets[planetId], `+${count}🪖`, '#7fd9ff'),
          )
          .value(),
    );
}
