import { COMBAT } from '@seven-planets/game';

export function computeMinimumTroopsToConquer(defenderTroops: number): number {
  if (defenderTroops <= 0) {
    return 1;
  }
  const { num, den } = COMBAT.winDefLoss;
  return Math.floor(((defenderTroops - 1) * den) / num) + 1;
}
