import {
  buildingCost,
  canAfford,
  CARDS,
  INFLUENCE_CARDS,
  maxLevel,
} from '../config/constants';
import { isSingularityLabOk } from './is-singularity-lab-ok';
import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { InfluenceType } from '../interfaces/influence-type';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import type { PoolType } from '../interfaces/pool-type';

import { hasBuilding } from './has-building';
import { getTechLevel } from './get-tech-level';
import { totalTroops } from './total-troops';

// Can this player take pool card `t` during `planet`'s draft turn?
export function canPickCard(
  state: GameState,
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
    if (next > getTechLevel(state, p)) {
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
    return hasBuilding(state, p, 'SILO') && totalTroops(state, p) >= 1;
  }
  if (t === 'MOVE') {
    return (
      hasBuilding(state, p, 'SPACEPORT') &&
      p.planets.length >= 2 &&
      totalTroops(state, p) >= 1
    );
  }
  if (t === 'RECRUIT') {
    return hasBuilding(state, p, 'BARRACKS');
  }
  if (t === 'TRADE') {
    return hasBuilding(state, p, 'EMBASSY');
  }
  return true;
}
