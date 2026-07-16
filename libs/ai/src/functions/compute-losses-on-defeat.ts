import { COMBAT } from '@seven-planets/game';

export function computeLossesOnDefeat(attackers: number): number {
  return Math.ceil(
    (attackers * COMBAT.loseAttLoss.num) / COMBAT.loseAttLoss.den,
  );
}
