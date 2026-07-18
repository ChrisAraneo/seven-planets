import { match } from 'ts-pattern';

import { BUILDINGS } from '../../config/constants';
import type { BuildingType } from '../../interfaces/building-type';

// TODO: to logging
export const getBuildVerb = (
  buildingType: BuildingType,
  level: number,
): string =>
  match(level)
    .when(
      () => level > 1,
      () =>
        `upgrades ${BUILDINGS[buildingType].icon} ${BUILDINGS[buildingType].name} to level ${level}`,
    )
    .otherwise(
      () =>
        `builds ${BUILDINGS[buildingType].icon} ${BUILDINGS[buildingType].name}`,
    );
