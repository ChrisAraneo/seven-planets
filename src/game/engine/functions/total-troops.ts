import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { ownedPlanets } from './owned-planets';

export function totalTroops(p: Player): number {
  const state = getGameState();
  return ownedPlanets(p).reduce((s, pl) => s + pl.troops, 0);
}
