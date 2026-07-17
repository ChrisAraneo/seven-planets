import { match, P } from 'ts-pattern';

import { BUILD_ORDER, BUILDINGS } from '../config/constants';
import type { Planet } from '../interfaces/planet';
import { chain } from '../utils/chain';
import { bumpNested } from './bump-nested';
import { computeIncomeAmount } from './compute-income-amount';
import type { IncomeTally } from './do-income';

const { number, string } = P;
export const addBuildingIncome = (
  tally: IncomeTally,
  ownerId: number,
  planet: Planet,
): IncomeTally =>
  BUILD_ORDER.reduce(
    (acc, buildingType) =>
      match({
        level: planet.buildings[buildingType],
        income: BUILDINGS[buildingType].income,
      })
        .with(
          { level: number.positive(), income: string },
          ({ level, income }) =>
            chain(computeIncomeAmount(buildingType, level))
              .thru((amount) => ({
                ...acc,
                handAdd: bumpNested(acc.handAdd, ownerId, income, amount),
                gains: bumpNested(acc.gains, ownerId, income, amount),
              }))
              .value(),
        )
        .otherwise(() => acc),
    tally,
  );
