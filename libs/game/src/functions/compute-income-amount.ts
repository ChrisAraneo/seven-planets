import { match } from 'ts-pattern';

import type { BuildingType } from '../interfaces/building-type';

const BOOSTED_MINE_LEVEL = 2;
const BOOSTED_MINE_INCOME = 3;
export const computeIncomeAmount = (id: BuildingType, lvl: number): number =>
  match({ id, lvl })
    .when(
      (candidate) =>
        candidate.id === 'MINE' && candidate.lvl >= BOOSTED_MINE_LEVEL,
      (): number => BOOSTED_MINE_INCOME,
    )
    .otherwise((candidate) => candidate.lvl);
