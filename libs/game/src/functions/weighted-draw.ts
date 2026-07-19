import { sumBy } from 'lodash-es';

import { CARDS } from '../config/constants';
import type { PoolType } from '../interfaces/pool-type';
import { pickByRoll } from './pick-by-roll';

export const weightedDraw = <T extends PoolType>(types: T[], fallback: T): T =>
  pickByRoll(
    types,
    Math.random() * sumBy(types, (type) => CARDS[type].weight),
  ) ?? fallback;
