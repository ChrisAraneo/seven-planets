import { COMBAT } from '@seven-planets/game';

export function battleWinProb(attackBase: number, defenseBase: number): number {
  const aR = COMBAT.attackRoll;
  const dR = COMBAT.defenseRoll;
  let wins = 0;
  for (let first = 0; first <= aR; first++) {
    for (let definition = 0; definition <= dR; definition++) {
      if (attackBase + first > defenseBase + definition) {
        wins++;
      }
    }
  }
  return wins / ((aR + 1) * (dR + 1));
}
