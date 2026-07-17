import { mapValues } from 'lodash-es';
import { match } from 'ts-pattern';

import { BUILDINGS } from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';
import type { Cost } from '../interfaces/cost';

export const computeBuildingCost = (id: BuildingType, level: number): Cost =>
  match(level)
    .when(
      () => level <= 1,
      () => BUILDINGS[id].cost,
    )
    .otherwise(() => mapValues(BUILDINGS[id].cost, (amount) => amount * level));
