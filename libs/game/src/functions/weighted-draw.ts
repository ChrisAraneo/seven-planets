import { sumBy } from 'lodash-es';

import { CARDS } from '../config/constants';
import type { PoolType } from '../interfaces/pool-type';

export function weightedDraw<T extends PoolType>(types: T[], fallback: T): T {
  return (
    pickByRoll(
      types,
      Math.random() * sumBy(types, (type) => CARDS[type].weight),
    ) ?? fallback
  );
}

function pickByRoll<T extends PoolType>(
  types: T[],
  roll: number,
): T | undefined {
  return types.find(
    (type, index) =>
      roll <
      sumBy(types.slice(0, index), (eachType) => CARDS[eachType].weight) +
        CARDS[type].weight,
  );
}
