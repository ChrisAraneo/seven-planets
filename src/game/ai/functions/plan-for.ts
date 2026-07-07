import type { GameState, Player } from '@/game/types';
import { aiState } from './ai-state';
import { computePlan } from './compute-plan';
import type { Plan, StrategyKind } from './plan-types';

export type { Plan, StrategyKind };

export function planFor(s: GameState, p: Player): Plan {
  let per = aiState.planCache.get(s);
  if (!per) {
    per = new Map();
    aiState.planCache.set(s, per);
  }
  const prev = per.get(p.id);
  if (prev && prev.computedTurn === s.turn) {
    return prev;
  }
  const plan = computePlan(s, p, prev?.kind ?? null);
  per.set(p.id, plan);
  return plan;
}
