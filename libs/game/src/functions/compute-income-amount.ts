import { match } from 'ts-pattern';

import type { BuildingType } from '../interfaces/building-type';

export const computeIncomeAmount = (id: BuildingType, lvl: number): number =>
  match({ id, lvl })
    .when(
      (candidate) => candidate.id === 'MINE' && candidate.lvl >= 2,
      (): number => 3,
    )
    .otherwise((candidate) => candidate.lvl);
