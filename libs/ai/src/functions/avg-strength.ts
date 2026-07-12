import { alive } from './alive';
import { playerStrength } from './player-strength';

export function avgStrength(): number {
  const all = alive().map((player) => playerStrength(player));
  return (
    all.reduce((first, building) => first + building, 0) / (all.length || 1)
  );
}
