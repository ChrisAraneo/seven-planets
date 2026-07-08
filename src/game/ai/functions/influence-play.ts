import type { InfluenceOpts, InfluenceType, Player } from '@/game/types';
import { getAiStore } from '@/stores/ai';
import { getGameState } from '@/stores/game-state';

import { alive } from './alive';
import { avgStrength } from './avg-strength';
import { bestCoupTarget } from './best-coup-target';
import { hasB } from './has-b';
import { immediateFallProb } from './immediate-fall-prob';
import { imminentAttacker } from './imminent-attacker';
import { owned } from './owned';
import { planFor } from './plan-for';
import { playerStrength } from './player-strength';
import { skipTarget } from './skip-target';
import { underTruce } from './under-truce';

export function influencePlay(
  p: Player,
): { type: InfluenceType; opts: InfluenceOpts; ev: number } | null {
  const aiState = getAiStore();
  const s = getGameState();
  const plan = planFor(p);
  if ((p.hand.COUP || 0) > 0) {
    const tgt = bestCoupTarget(p);
    if (tgt && tgt.value >= aiState.W.coupValueFloor) {
      return { type: 'COUP', opts: { planet: tgt.planet }, ev: tgt.value };
    }
  }
  if ((p.hand.PEACE || 0) > 0) {
    const worst = Math.max(
      0,
      ...owned(p).map((pl) => immediateFallProb(p, pl)),
    );
    if (worst >= aiState.W.peaceThreatFloor) {
      return { type: 'PEACE', opts: {}, ev: worst * 10 };
    }
  }
  const avg = avgStrength();
  for (const t of [
    'SKIP_ARMY',
    'SKIP_PLANETS',
    'SKIP_TECH',
    'SKIP_INFLUENCE',
  ] as InfluenceType[]) {
    if ((p.hand[t] || 0) < 1) {
      continue;
    }
    const target = skipTarget(p, t);
    if (!target) {
      continue;
    }
    const scary =
      playerStrength(target) >= avg * 1.15 ||
      imminentAttacker(p, target) ||
      alive().length === 2;
    if (scary) {
      return { type: t, opts: {}, ev: 3 };
    }
  }
  if ((p.hand.STEAL_ACTION || 0) > 0) {
    const rivals = alive().filter((x) => x.id !== p.id);
    const byStrength = (a: Player, b: Player) =>
      playerStrength(b) - playerStrength(a);
    const danger = rivals
      .filter((r) => imminentAttacker(p, r))
      .sort(byStrength);
    if (danger.length > 0) {
      return {
        type: 'STEAL_ACTION',
        opts: { target: danger[0], cardType: 'ATTACK' },
        ev: 3,
      };
    }
    if (
      (plan.kind === 'STRIKE' || plan.kind === 'MILITARIZE') &&
      (p.hand.ATTACK || 0) === 0 &&
      hasB(p, 'SILO')
    ) {
      const holder = rivals
        .filter((r) => (r.hand.ATTACK || 0) > 0)
        .sort(byStrength)[0];
      if (holder) {
        return {
          type: 'STEAL_ACTION',
          opts: { target: holder, cardType: 'ATTACK' },
          ev: 2.5,
        };
      }
    }
    const wants: ('RECRUIT' | 'TRADE')[] = [];
    if (hasB(p, 'BARRACKS') && (p.hand.RECRUIT || 0) === 0) {
      wants.push('RECRUIT');
    }
    if (hasB(p, 'EMBASSY') && (p.hand.TRADE || 0) === 0) {
      wants.push('TRADE');
    }
    for (const a of wants) {
      const holder = rivals
        .filter((r) => (r.hand[a] || 0) > 0 && playerStrength(r) >= avg)
        .sort(byStrength)[0];
      if (holder) {
        return {
          type: 'STEAL_ACTION',
          opts: { target: holder, cardType: a },
          ev: 2,
        };
      }
    }
  }
  return null;
}
