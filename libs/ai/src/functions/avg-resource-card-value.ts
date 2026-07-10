import { CARDS, RESOURCE_TYPES } from '@seven-planets/game';

export function avgResourceCardValue(): number {
  const types = RESOURCE_TYPES.filter((t) => t !== 'SPICE');
  let w = 0;
  let v = 0;
  for (const t of types) {
    w += CARDS[t].weight;
    v += CARDS[t].weight * CARDS[t].value;
  }
  return w ? v / w : 1;
}
