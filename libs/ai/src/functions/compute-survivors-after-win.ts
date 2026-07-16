import { COMBAT } from '@seven-planets/game';

export function computeSurvivorsAfterWin(attackers: number): number {
  return (
    attackers -
    Math.floor((attackers * COMBAT.winAttLoss.num) / COMBAT.winAttLoss.den)
  );
}
