import { sumBy } from 'lodash-es';

import { CARDS } from '../config/constants';
import type { PoolType } from '../interfaces/pool-type';

export const pickByRoll = <T extends PoolType>(
  types: T[],
  roll: number,
): T | undefined =>
  types.find(
    (type, index) =>
      roll <
      sumBy(types.slice(0, index), (eachType) => CARDS[eachType].weight) +
        CARDS[type].weight,
  );
