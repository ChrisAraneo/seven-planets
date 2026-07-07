import { canAfford, CARDS, RESOURCE_TYPES } from '@/game/constants';
import type {
  GameState,
  InfluenceType,
  Planet,
  Player,
  PoolType,
} from '@/game/types';
import { aiState } from './ai-state';
import { buildingWorth } from './building-worth';
import { handAfterCost } from './hand-after-cost';
import { hasB } from './has-b';
import { influenceDraftValue } from './influence-draft-value';
import { nextLevelAllowed } from './next-level-allowed';
import { owned } from './owned';
import { totalTroops } from './total-troops';
import type { Plan } from './plan-types';
import { buildingCost } from '@/game/constants';

function garrisonFloor(s: GameState): number {
  return 2 + Math.min(8, Math.floor(s.turn / 4));
}

export function ownDraftValue(
  s: GameState,
  p: Player,
  draftPlanet: Planet,
  t: PoolType,
  plan: Plan,
): number {
  const def = CARDS[t];
  if (def.building) {
    const id = t as Parameters<typeof nextLevelAllowed>[3];
    const level = nextLevelAllowed(s, p, draftPlanet, id);
    if (!level) {
      return -1;
    }
    const worth = buildingWorth(s, p, id, draftPlanet, level);
    let v = 1.5 + worth / 6;
    if (plan.buildQueue[0]?.id === id) {
      v += 2;
    } else if (plan.buildQueue.some((c) => c.id === id)) {
      v += 1;
    }
    const head = plan.buildQueue[0];
    if (head && head.id !== id && canAfford(p.hand, head.cost)) {
      const after = handAfterCost(p.hand, buildingCost(id, level));
      if (!canAfford(after, head.cost)) {
        v -= 2;
      }
    }
    return v;
  }
  if (def.influenceCard) {
    return influenceDraftValue(s, p, t as InfluenceType, plan);
  }
  if (t === 'ATTACK') {
    if (p.pacifistStatus) {
      return -1;
    }
    let v = 1.2;
    if (
      (plan.kind === 'STRIKE' || plan.kind === 'MILITARIZE') &&
      hasB(s, p, 'SILO')
    ) {
      v += 1.6;
    }
    if (
      (p.hand.ATTACK || 0) === 0 &&
      hasB(s, p, 'SILO') &&
      totalTroops(s, p) >= 4
    ) {
      v += 1;
    }
    return v - (p.hand.ATTACK || 0) * 0.5;
  }
  if (t === 'RECRUIT') {
    let v = 1.3;
    if (
      hasB(s, p, 'BARRACKS') &&
      owned(s, p).some((pl) => pl.troops < garrisonFloor(s))
    ) {
      v += 1.5;
    }
    v += Math.min(2.5, plan.threat * 0.4);
    if (plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') {
      v += 1.6;
    }
    return v - (p.hand.RECRUIT || 0) * 0.4;
  }
  if (t === 'MOVE') {
    let v = 0.8;
    if (p.planets.length >= 2 && hasB(s, p, 'SPACEPORT')) {
      v += 0.8;
    }
    return v - (p.hand.MOVE || 0) * 0.6;
  }
  if (t === 'TRADE') {
    let v = 1;
    if (hasB(s, p, 'EMBASSY')) {
      v += 0.6;
    }
    return v - (p.hand.TRADE || 0) * 0.5;
  }
  let v = def.value;
  const head = plan.buildQueue[0];
  if (head && (head.cost[t] || 0) > (p.hand[t] || 0)) {
    v += 1.6;
  }
  if ((plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') && t === 'ORE') {
    v += 0.8;
  }
  if (t === 'RELIC') {
    v += 0.3;
  }
  return v - Math.min(1.5, (p.hand[t] || 0) * 0.08);
}
