import { COMBAT } from '@seven-planets/game';

export function lossesOnDefeat(n: number): number {
  return Math.ceil((n * COMBAT.loseAttLoss.num) / COMBAT.loseAttLoss.den);
}
