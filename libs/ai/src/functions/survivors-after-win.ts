import { COMBAT } from '@seven-planets/game';

export function survivorsAfterWin(count: number): number {
  return (
    count - Math.floor((count * COMBAT.winAttLoss.num) / COMBAT.winAttLoss.den)
  );
}
