// NOTE: This function is not used anywhere in the current codebase.
// It was part of the old non-mastermind AI personality system.
import { CARDS, RESOURCE_TYPES } from '@/game/constants';
import type { Player, TradeOffer } from '@/game/types';
import { alivePlayers } from './alive-players';
import { AUTO_HUMAN } from './auto-human';
import { currentGoal } from './current-goal';
import { hasActionCard } from './has-action-card';
import { hasBuilding } from './has-building';

export function aiPlanTrade(p: Player): TradeOffer | null {
  if (!hasActionCard(p, 'TRADE') || !hasBuilding(p, 'EMBASSY')) {
    return null;
  }
  const goal = currentGoal(p);
  if (!goal) {
    return null;
  }
  const missing = RESOURCE_TYPES.filter((t) => (goal.cost[t] || 0) > p.hand[t]);
  if (missing.length === 0) {
    return null;
  }
  const want = missing[0];

  // Surplus = resources beyond what the goal needs (relics/action cards never given)
  const surplus: string[] = [];
  for (const t of RESOURCE_TYPES) {
    if (t === 'RELIC') {
      continue;
    }
    const spare = p.hand[t] - (goal.cost[t] || 0);
    for (let i = 0; i < spare; i++) {
      surplus.push(t);
    }
  }
  surplus.sort((a, b) => CARDS[a].value - CARDS[b].value);

  const gives: Record<string, number> = {};
  let v = 0;
  const targetV = CARDS[want].value;
  for (const t of surplus) {
    if (v >= targetV) {
      break;
    }
    gives[t] = (gives[t] || 0) + 1;
    v += CARDS[t].value;
  }
  if (v < targetV) {
    return null;
  }

  const partners = alivePlayers()
    .filter((x) => x.id !== p.id && x.hand[want] > 0)
    .sort((a, b) => b.hand[want] - a.hand[want]);
  if (partners.length === 0) {
    return null;
  }
  let partner = partners[0];
  // Don't pester the human every turn
  if (partner.isHuman && !AUTO_HUMAN && Math.random() < 0.5) {
    partner = partners[1] || partner;
  }
  return { partner, gives, gets: { [want]: 1 } };
}
