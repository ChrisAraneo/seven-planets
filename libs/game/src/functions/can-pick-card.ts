import { match, P } from 'ts-pattern';
import {
  buildingCost,
  canAfford,
  CARDS,
  INFLUENCE_CARDS,
  maxLevel,
} from '../config/constants';
import { isSingularityLabOk } from './is-singularity-lab-ok';
import { ownedPlanets } from './owned-planets';
import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { InfluenceType } from '../interfaces/influence-type';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import type { PoolType } from '../interfaces/pool-type';

import { hasBuilding } from './has-building';
import { getTechLevel } from './get-tech-level';
import { totalTroops } from './total-troops';

const { nullish } = P;

// Can this player take pool card `t` during `planet`'s draft turn?
export function canPickCard(
  state: GameState,
  p: Player,
  t: PoolType,
  planet: Planet | undefined,
): boolean {
  return match(t)
    .when(
      (type) => Boolean(CARDS[type].building),
      (type) => canPickBuilding(state, p, type as BuildingType, planet),
    )
    .when(
      // Influence cards cost ⭐ at pick time and go to hand; targets resolved later.
      (type) => Boolean(CARDS[type].influenceCard),
      (type) => p.influence >= INFLUENCE_CARDS[type as InfluenceType].cost,
    )
    .with(
      'ATTACK',
      () => hasBuilding(state, p, 'SILO') && totalTroops(state, p) >= 1,
    )
    .with(
      'MOVE',
      () =>
        hasBuilding(state, p, 'SPACEPORT') &&
        ownedPlanets(state, p).length >= 2 &&
        totalTroops(state, p) >= 1,
    )
    .with('RECRUIT', () => hasBuilding(state, p, 'BARRACKS'))
    .with('TRADE', () => hasBuilding(state, p, 'EMBASSY'))
    .otherwise(() => true);
}

function canPickBuilding(
  state: GameState,
  p: Player,
  bt: BuildingType,
  planet: Planet | undefined,
): boolean {
  return match(planet)
    .with(nullish, () => false)
    .otherwise((pl) =>
      match((pl.buildings[bt] || 0) + 1)
        .when(
          (next) => next > maxLevel(bt),
          () => false,
        )
        .when(
          // Upgrades are gated by technology
          (next) => next > getTechLevel(state, p),
          () => false,
        )
        .when(
          (next) => bt === 'SINGULARITY' && !isSingularityLabOk(pl, next),
          () => false,
        )
        .otherwise((next) => canAfford(p.hand, buildingCost(bt, next))),
    );
}
