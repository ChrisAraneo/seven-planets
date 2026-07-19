import { CARDS } from '../config/constants';
import type { Cost } from '../interfaces/cost';

export const getCostLabel = (cost: Cost): string =>
  Object.keys(cost)
    .map((type) => `${cost[type]}${CARDS[type].icon}`)
    .join(' ');
