import type { GameState, Player } from '@/game/types';
import { owned } from './owned';
import { recruitRate } from './recruit-rate';
import { rocketCap } from '@/game/shared/rocket-cap';
import { siloBonus } from '@/game/shared/silo-bonus';

export function projectedStrike(
  s: GameState,
  r: Player,
  turnsAhead: number,
  excludePlanetId = -1,
): { n: number; bonus: number } {
  let best = { n: 0, bonus: 0 };
  const growth = recruitRate(s, r) * turnsAhead;
  for (const pl of owned(s, r)) {
    if (pl.id === excludePlanetId || !pl.buildings.SILO) {
      continue;
    }
    const n = Math.min(rocketCap(pl), Math.floor(pl.troops + growth) - 1);
    if (n > best.n) {
      best = { n, bonus: siloBonus(pl) };
    }
  }
  return best;
}
