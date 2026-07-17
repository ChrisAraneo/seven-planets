import { COMBAT } from '@seven-planets/game';

export function computeBattleWinProbability(
  attackBase: number,
  defenseBase: number,
): number {
  const { attackRoll } = COMBAT;
  const { defenseRoll } = COMBAT;
  let wins = 0;
  for (let attackerRoll = 0; attackerRoll <= attackRoll; attackerRoll++) {
    for (let defenderRoll = 0; defenderRoll <= defenseRoll; defenderRoll++) {
      if (attackBase + attackerRoll > defenseBase + defenderRoll) {
        wins++;
      }
    }
  }
  return wins / ((attackRoll + 1) * (defenseRoll + 1));
}
