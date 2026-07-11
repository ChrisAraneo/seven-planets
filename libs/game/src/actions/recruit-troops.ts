import { chain, cloneDeep, noop } from 'lodash-es';
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
          .tap((s) =>
            executeRecruit(s, payload.playerId, payload.planetId, hooks),
          )
          .tap((s) => setGameState(s))
          .value(),
    );
}

// Applies pure engine results onto the private clone via Object.assign so the
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
          Object.assign(state, spendActionCard(state, playerId, 'RECRUIT')),
        )
          .thru((s) =>
            Object.assign(s, payCost(s, playerId, recruitCost(planet))),
          )
          .thru((s) => ({ s, n: recruitYield(planet) }))
          .tap(({ s, n }) =>
            Object.assign(s.planets[planetId], {
              troops: s.planets[planetId].troops + n,
            }),
          )
          .tap(({ s, n }) =>
            Object.assign(
              s,
              log(
                s,
                `🪖 ${s.players[playerId].name} recruits ${n} troop${pluralSuffix(n)} on ${planet.name} (garrison now ${s.planets[planetId].troops})`,
                'build',
              ),
            ),
          )
          .tap(({ s, n }) =>
            hooks.floatText(s.planets[planetId], `+${n}🪖`, '#7fd9ff'),
          )
          .value(),
    );
}
