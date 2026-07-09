import { COMBAT } from '@/game/constants';

export function lossesOnDefeat(n: number): number {
  return Math.ceil((n * COMBAT.loseAttLoss.num) / COMBAT.loseAttLoss.den);
}
