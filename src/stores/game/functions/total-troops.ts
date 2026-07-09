import type { GameState, Player } from '@/game/types';

import { ownedPlanets } from './owned-planets';

export function totalTroops(state: GameState, p: Player): number {
  return ownedPlanets(state, p).reduce((s, pl) => s + pl.troops, 0);
}
