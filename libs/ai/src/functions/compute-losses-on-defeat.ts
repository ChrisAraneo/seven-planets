import { COMBAT } from '@seven-planets/game';

export const computeLossesOnDefeat = (attackers: number): number =>
  Math.ceil((attackers * COMBAT.loseAttLoss.num) / COMBAT.loseAttLoss.den);
