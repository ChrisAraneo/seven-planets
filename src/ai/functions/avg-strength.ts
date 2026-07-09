import { alive } from './alive';
import { playerStrength } from './player-strength';

export function avgStrength(): number {
  const all = alive().map((x) => playerStrength(x));
  return all.reduce((a, b) => a + b, 0) / (all.length || 1);
}
