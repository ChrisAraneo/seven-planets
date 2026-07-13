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
  player: Player,
  poolType: PoolType,
  planet: Planet | undefined,
): boolean {
  return match(poolType)
    .when(
      (type) => Boolean(CARDS[type].building),
      (type) => canPickBuilding(state, player, type as BuildingType, planet),
    )
    .when(
      // Influence cards cost ⭐ at pick time and go to hand; targets resolved later.
      (type) => Boolean(CARDS[type].influenceCard),
      (type) => player.influence >= INFLUENCE_CARDS[type as InfluenceType].cost,
    )
    .with(
      'ATTACK',
      () =>
        hasBuilding(state, player, 'SILO') && totalTroops(state, player) >= 1,
    )
    .with(
      'MOVE',
      () =>
        hasBuilding(state, player, 'SPACEPORT') &&
        ownedPlanets(state, player).length >= 2 &&
        totalTroops(state, player) >= 1,
    )
    .with('RECRUIT', () => hasBuilding(state, player, 'BARRACKS'))
    .with('TRADE', () => hasBuilding(state, player, 'EMBASSY'))
    .otherwise(() => true);
}

function canPickBuilding(
  state: GameState,
  player: Player,
  buildingType: BuildingType,
  planet: Planet | undefined,
): boolean {
  return match(planet)
    .with(nullish, () => false)
    .otherwise((planet) =>
      match((planet.buildings[buildingType] || 0) + 1)
        .when(
          (next) => next > maxLevel(buildingType),
          () => false,
        )
        .when(
          // Upgrades are gated by technology
          (next) => next > getTechLevel(state, player),
          () => false,
        )
        .when(
          (next) =>
            buildingType === 'SINGULARITY' && !isSingularityLabOk(planet, next),
          () => false,
        )
        .otherwise((next) =>
          canAfford(player.hand, buildingCost(buildingType, next)),
        ),
    );
}
