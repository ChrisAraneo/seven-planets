import type { Player } from '@/game/types';

import { ownedPlanets } from '@/game/actions/common/owned-planets';

export function buildingCount(p: Player): number {
  return ownedPlanets(p).reduce(
    (s, pl) => s + Object.values(pl.buildings).reduce((a, b) => a + b, 0),
    0,
  );
}
