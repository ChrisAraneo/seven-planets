import { COMBAT } from '@seven-planets/game';

export function survivorsAfterWin(n: number): number {
  return n - Math.floor((n * COMBAT.winAttLoss.num) / COMBAT.winAttLoss.den);
}
