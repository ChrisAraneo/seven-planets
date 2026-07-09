import { COMBAT } from '@/game/config/constants';

export function survivorsAfterWin(n: number): number {
  return n - Math.floor((n * COMBAT.winAttLoss.num) / COMBAT.winAttLoss.den);
}
