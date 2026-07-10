import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import type { Player } from '@seven-planets/game';
import { getGameState } from '@seven-planets/game';

import { computePlan } from './compute-plan';
import type { Plan } from './plan-types';

export function planFor(p: Player): Plan {
  const aiState = getAiState();
  const s = getGameState();
  let per = aiState.planCache.get(s);
  if (!per) {
    per = new Map();
    aiState.planCache.set(s, per);
  }
  const prev = per.get(p.id);
  if (prev && prev.computedTurn === getTurn()) {
    return prev;
  }
  const plan = computePlan(p, prev?.kind ?? null);
  per.set(p.id, plan);
  return plan;
}

export { type Plan, type StrategyKind } from './plan-types';
