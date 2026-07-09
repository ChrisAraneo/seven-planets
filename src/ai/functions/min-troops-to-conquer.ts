import { COMBAT } from '@/game/config/constants';

export function minTroopsToConquer(defTroops: number): number {
  if (defTroops <= 0) {
    return 1;
  }
  const { num, den } = COMBAT.winDefLoss;
  return Math.floor(((defTroops - 1) * den) / num) + 1;
}
