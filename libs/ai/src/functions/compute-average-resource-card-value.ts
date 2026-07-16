import { CARDS, RESOURCE_TYPES } from '@seven-planets/game';

export function computeAverageResourceCardValue(): number {
  const resourceTypes = RESOURCE_TYPES.filter(
    (resourceType) => resourceType !== 'SPICE',
  );
  let totalWeight = 0;
  let weightedValue = 0;
  for (const resourceType of resourceTypes) {
    totalWeight += CARDS[resourceType].weight;
    weightedValue += CARDS[resourceType].weight * CARDS[resourceType].value;
  }
  return totalWeight ? weightedValue / totalWeight : 1;
}
