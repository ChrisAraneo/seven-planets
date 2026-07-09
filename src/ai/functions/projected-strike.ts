import { rocketCap } from '@/game/shared/rocket-cap';
import { siloBonus } from '@/game/shared/silo-bonus';
import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { owned } from './owned';
import { recruitRate } from './recruit-rate';

export function projectedStrike(
  r: Player,
  turnsAhead: number,
  excludePlanetId = -1,
): { n: number; bonus: number } {
  const s = getGameState();
  let best = { n: 0, bonus: 0 };
  const growth = recruitRate(r) * turnsAhead;
  for (const pl of owned(r)) {
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
