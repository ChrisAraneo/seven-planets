import { COMBAT } from '@seven-planets/game';

export const computeSurvivorsAfterWin = (attackers: number): number =>
  attackers -
  Math.floor((attackers * COMBAT.winAttLoss.num) / COMBAT.winAttLoss.den);
