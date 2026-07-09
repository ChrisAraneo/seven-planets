import { COMBAT } from '@/game/config/constants';

export function lossesOnDefeat(n: number): number {
  return Math.ceil((n * COMBAT.loseAttLoss.num) / COMBAT.loseAttLoss.den);
}
