import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import type { Player } from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';

import { computePlan } from './compute-plan';
import type { Plan } from './plan-types';

export function planFor(player: Player): Plan {
  const aiState = getAiState();
  const state = getGameStateLastValue();
  let per = aiState.planCache.get(state);
  if (!per) {
    per = new Map();
    aiState.planCache.set(state, per);
  }
  const prev = per.get(player.id);
  if (prev && prev.computedTurn === getTurn()) {
    return prev;
  }
  const plan = computePlan(player, prev?.kind ?? null);
  per.set(player.id, plan);
  return plan;
}

export { type Plan, type StrategyKind } from './plan-types';
