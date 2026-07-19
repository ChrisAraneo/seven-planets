import { match } from 'ts-pattern';

import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { nullish } from '../utils/p';
import { canAfford } from './can-afford';
import { canBuildSingularity } from './can-build-singularity';
import { computeBuildingCost } from './compute-building-cost';
import { getBuildingLevel } from './extractors/get-building-level';
import { getMaxLevel } from './extractors/get-max-level';
import { getTechLevel } from './extractors/get-tech-level';

export const canPickBuilding = (
  state: GameState,
  player: Player,
  buildingType: BuildingType,
  planet: Planet | undefined,
): boolean =>
  match(planet)
    .with(nullish, () => false)
    .otherwise((target) =>
      match(getBuildingLevel(target, buildingType) + 1)
        .when(
          (next) => next > getMaxLevel(buildingType),
          () => false,
        )
        .when(
          (next) => next > getTechLevel(state, player),
          () => false,
        )
        .when(
          (next) =>
            buildingType === 'SINGULARITY' &&
            !canBuildSingularity(target, next),
          () => false,
        )
        .when(
          () => buildingType === 'EMBASSY' && !target.buildings.SPACEPORT,
          () => false,
        )
        .otherwise((next) =>
          canAfford(player.hand, computeBuildingCost(buildingType, next)),
        ),
    );
