import { COMBAT } from '@/game/config/constants';

export function battleWinProb(attackBase: number, defenseBase: number): number {
  const aR = COMBAT.attackRoll;
  const dR = COMBAT.defenseRoll;
  let wins = 0;
  for (let a = 0; a <= aR; a++) {
    for (let d = 0; d <= dR; d++) {
      if (attackBase + a > defenseBase + d) {
        wins++;
      }
    }
  }
  return wins / ((aR + 1) * (dR + 1));
}
