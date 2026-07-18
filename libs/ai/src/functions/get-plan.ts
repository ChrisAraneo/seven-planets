import type { Player } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { computePlan } from './compute-plan';
import type { Plan, StrategyKind } from './plan-types';

const storePlan = (
  playerPlans: Map<number, Plan>,
  player: Player,
  previousKind: StrategyKind | null,
): Plan =>
  chain(computePlan(player, previousKind))
    .tap((plan) => playerPlans.set(player.id, plan))
    .value();

export const getPlan = (player: Player): Plan =>
  chain({ aiState: getAiState(), state: getGameStateLastValue() })
    .thru(
      ({ aiState, state }) =>
        aiState.planCache.get(state) ??
        chain(new Map<number, Plan>())
          .tap((playerPlans) => aiState.planCache.set(state, playerPlans))
          .value(),
    )
    .thru((playerPlans) =>
      match(playerPlans.get(player.id))
        .with(nullish, () => storePlan(playerPlans, player, null))
        .when(
          (cachedPlan) => cachedPlan.computedTurn === getTurn(),
          (cachedPlan) => cachedPlan,
        )
        .otherwise((cachedPlan) =>
          storePlan(playerPlans, player, cachedPlan.kind),
        ),
    )
    .value();

export { type Plan, type StrategyKind } from './plan-types';
