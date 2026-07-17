import { match, P } from 'ts-pattern';

import {
  canAfford,
  computeBuildingCost,
  getMaxLevel,
  INFLUENCE_CARDS,
} from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import type { PoolType } from '../interfaces/pool-type';
import { computeTotalTroops } from './compute-total-troops';
import { getOwnedPlanets } from './get-owned-planets';
import { getTechLevel } from './get-tech-level';
import { hasBuilding } from './has-building';
import { isBuildingType } from './is-building-type';
import { isInfluenceType } from './is-influence-type';
import { isSingularityLabOk } from './is-singularity-lab-ok';

const { nullish } = P;

// Can this player take pool card `t` during `planet`'s draft turn?
export function canPickCard(
  state: GameState,
  player: Player,
  poolType: PoolType,
  planet: Planet | undefined,
): boolean {
  return match(poolType)
    .when(isBuildingType, (type) =>
      canPickBuilding(state, player, type, planet),
    )
    .when(
      // Influence cards cost ⭐ at pick time and go to hand; targets resolved later.
      isInfluenceType,
      (type) => player.influence >= INFLUENCE_CARDS[type].cost,
    )
    .with(
      'ATTACK',
      () =>
        hasBuilding(state, player, 'SILO') &&
        computeTotalTroops(state, player) >= 1,
    )
    .with(
      'MOVE',
      () =>
        hasBuilding(state, player, 'SPACEPORT') &&
        getOwnedPlanets(state, player).length >= 2 &&
        computeTotalTroops(state, player) >= 1,
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
    .otherwise((target) =>
      match((target.buildings[buildingType] || 0) + 1)
        .when(
          (next) => next > getMaxLevel(buildingType),
          () => false,
        )
        .when(
          // Upgrades are gated by technology
          (next) => next > getTechLevel(state, player),
          () => false,
        )
        .when(
          (next) =>
            buildingType === 'SINGULARITY' && !isSingularityLabOk(target, next),
          () => false,
        )
        .when(
          // An Embassy needs a Spaceport already standing on the same planet.
          () => buildingType === 'EMBASSY' && !target.buildings.SPACEPORT,
          () => false,
        )
        .otherwise((next) =>
          canAfford(player.hand, computeBuildingCost(buildingType, next)),
        ),
    );
}
