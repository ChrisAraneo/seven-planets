import { match, P } from 'ts-pattern';

import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { canAfford } from './can-afford';
import { computeBuildingCost } from './compute-building-cost';
import { getMaxLevel } from './get-max-level';
import { getTechLevel } from './get-tech-level';
import { isSingularityLabOk } from './is-singularity-lab-ok';

const { nullish } = P;
export const canPickBuilding = (
  state: GameState,
  player: Player,
  buildingType: BuildingType,
  planet: Planet | undefined,
): boolean =>
  match(planet)
    .with(nullish, () => false)
    .otherwise((target) =>
      match((target.buildings[buildingType] || 0) + 1)
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
            buildingType === 'SINGULARITY' && !isSingularityLabOk(target, next),
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
