import type { Player } from '@/game/types';
import { getAiStore } from '@/stores/ai';
import { getGameState } from '@/stores/game-state';

import { computePlan } from './compute-plan';
import type { Plan } from './plan-types';

export function planFor(p: Player): Plan {
  const aiState = getAiStore();
  const s = getGameState();
  let per = aiState.planCache.get(s);
  if (!per) {
    per = new Map();
    aiState.planCache.set(s, per);
  }
  const prev = per.get(p.id);
  if (prev && prev.computedTurn === s.turn) {
    return prev;
  }
  const plan = computePlan(p, prev?.kind ?? null);
  per.set(p.id, plan);
  return plan;
}

export { type Plan, type StrategyKind } from './plan-types';
