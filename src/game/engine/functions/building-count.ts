import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { ownedPlanets } from './owned-planets';

export function buildingCount(p: Player): number {
  const state = getGameState();
  return ownedPlanets(p).reduce(
    (s, pl) => s + Object.values(pl.buildings).reduce((a, b) => a + b, 0),
    0,
  );
}
