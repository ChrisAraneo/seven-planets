import {
  buildingCost,
  canAfford,
  CARDS,
  INFLUENCE_CARDS,
  maxLevel,
} from '@/game/constants';
import type {
  BuildingType,
  InfluenceType,
  Planet,
  Player,
  PoolType,
} from '@/game/types';
import { hasBuilding } from './has-building';
import { isSingularityLabOk } from './is-singularity-lab-ok';
import { techLevel } from './tech-level';
import { totalTroops } from './total-troops';

// Can this player take pool card `t` during `planet`'s draft turn?
export function canPickCard(
  p: Player,
  t: PoolType,
  planet: Planet | undefined,
): boolean {
  if (CARDS[t].building) {
    if (!planet) {
      return false;
    }
    const bt = t as BuildingType;
    const next = (planet.buildings[bt] || 0) + 1;
    if (next > maxLevel(bt)) {
      return false;
    }
    if (next > techLevel(p)) {
      return false;
    } // Upgrades are gated by technology
    if (bt === 'SINGULARITY' && !isSingularityLabOk(planet, next)) {
      return false;
    }
    return canAfford(p.hand, buildingCost(bt, next));
  }
  // Influence cards cost ⭐ at pick time and go to hand; targets resolved later.
  if (CARDS[t].influenceCard) {
    return p.influence >= INFLUENCE_CARDS[t as InfluenceType].cost;
  }
  if (t === 'ATTACK') {
    return hasBuilding(p, 'SILO') && totalTroops(p) >= 1;
  }
  if (t === 'MOVE') {
    return (
      hasBuilding(p, 'SPACEPORT') &&
      p.planets.length >= 2 &&
      totalTroops(p) >= 1
    );
  }
  if (t === 'RECRUIT') {
    return hasBuilding(p, 'BARRACKS');
  }
  if (t === 'TRADE') {
    return hasBuilding(p, 'EMBASSY');
  }
  return true;
}
