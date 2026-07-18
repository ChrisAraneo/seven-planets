import { CARDS, RESOURCE_TYPES } from '@seven-planets/game';
import { sumBy } from 'lodash-es';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';

export const computeAverageResourceCardValue = (): number =>
  chain(RESOURCE_TYPES.filter((resourceType) => resourceType !== 'SPICE'))
    .thru((resourceTypes) => ({
      totalWeight: sumBy(
        resourceTypes,
        (resourceType) => CARDS[resourceType].weight,
      ),
      weightedValue: sumBy(
        resourceTypes,
        (resourceType) =>
          CARDS[resourceType].weight * CARDS[resourceType].value,
      ),
    }))
    .thru(({ totalWeight, weightedValue }) =>
      match(totalWeight)
        .with(0, () => 1)
        .otherwise(() => weightedValue / totalWeight),
    )
    .value();
