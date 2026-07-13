import { COMBAT } from '@seven-planets/game';

export function lossesOnDefeat(count: number): number {
  return Math.ceil((count * COMBAT.loseAttLoss.num) / COMBAT.loseAttLoss.den);
}
