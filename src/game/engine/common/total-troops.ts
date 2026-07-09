import type { Player } from '@/game/types';

import { ownedPlanets } from './owned-planets';

export function totalTroops(p: Player): number {
  return ownedPlanets(p).reduce((s, pl) => s + pl.troops, 0);
}
