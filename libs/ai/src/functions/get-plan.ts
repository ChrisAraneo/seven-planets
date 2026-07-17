import type { Player } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';

import { getAiState } from '../state';
import { computePlan } from './compute-plan';
import type { Plan } from './plan-types';

export const getPlan = (player: Player): Plan => {
  const aiState = getAiState();
  const state = getGameStateLastValue();
  let playerPlans = aiState.planCache.get(state);
  if (!playerPlans) {
    playerPlans = new Map();
    aiState.planCache.set(state, playerPlans);
  }
  const cachedPlan = playerPlans.get(player.id);
  if (cachedPlan && cachedPlan.computedTurn === getTurn()) {
    return cachedPlan;
  }
  const plan = computePlan(player, cachedPlan?.kind ?? null);
  playerPlans.set(player.id, plan);
  return plan;
};

export { type Plan, type StrategyKind } from './plan-types';
