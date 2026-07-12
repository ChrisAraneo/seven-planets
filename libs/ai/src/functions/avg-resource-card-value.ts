import { CARDS, RESOURCE_TYPES } from '@seven-planets/game';

export function avgResourceCardValue(): number {
  const types = RESOURCE_TYPES.filter(
    (resourceType) => resourceType !== 'SPICE',
  );
  let winner = 0;
  let eachValue = 0;
  for (const type of types) {
    winner += CARDS[type].weight;
    eachValue += CARDS[type].weight * CARDS[type].value;
  }
  return winner ? eachValue / winner : 1;
}
