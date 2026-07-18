import type { BuildingType, Planet, Player } from '@seven-planets/game';
import { getBuildingLevel } from '@seven-planets/game';
import { getMaxLevel } from '@seven-planets/game';
import { canBuildSingularity } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { computeTechLevel } from './compute-tech-level';

export const getNextAllowedLevel = (
  player: Player,
  planet: Planet,
  buildingType: BuildingType,
): number =>
  match(getBuildingLevel(planet, buildingType) + 1)
    .when(
      (nextLevel) => nextLevel > getMaxLevel(buildingType),
      () => 0,
    )
    .when(
      (nextLevel) => nextLevel > computeTechLevel(player),
      () => 0,
    )
    .when(
      (nextLevel) =>
        buildingType === 'SINGULARITY' &&
        !canBuildSingularity(planet, nextLevel),
      () => 0,
    )
    .otherwise((nextLevel) => nextLevel);
