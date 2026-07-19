import type { BuildingType, Cost, Player } from '@seven-planets/game';
import {
  computeBuildingCost,
  getBuildingLevel,
  getMaxLevel,
  PRIORITIES,
} from '@seven-planets/game';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { computeTechLevel } from './compute-tech-level';
import { getOwnedPlanets } from './get-owned-planets';

export const getRivalGoalBuilding = (
  player: Player,
): { id: BuildingType; cost: Cost } | null =>
  chain(computeTechLevel(player))
    .thru((techLevel) =>
      PRIORITIES.filter((candidate) => candidate !== 'SINGULARITY').flatMap(
        (buildingType) =>
          getOwnedPlanets(player)
            .filter(
              (ownedPlanet) =>
                getBuildingLevel(ownedPlanet, buildingType) <
                Math.min(getMaxLevel(buildingType), techLevel),
            )
            .slice(0, 1)
            .map((planet) => ({ buildingType, planet })),
      ),
    )
    .thru((candidates) =>
      match(candidates.at(0))
        .with(nullish, () => null)
        .otherwise(({ buildingType, planet }) => ({
          id: buildingType,
          cost: computeBuildingCost(
            buildingType,
            getBuildingLevel(planet, buildingType) + 1,
          ),
        })),
    )
    .value();
