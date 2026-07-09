import { BUILD_ORDER, BUILDINGS, handValue } from '@/game/constants';
import type { Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { owned } from './owned';
import { totalTroops } from './total-troops';

export function playerStrength(p: Player): number {
  const s = getGameState();
  const resources = handValue(p.hand);
  const military = totalTroops(p) * 1.5;
  const territory = p.planets.length * 8;
  const income = owned(p).reduce(
    (sum, pl) =>
      sum +
      BUILD_ORDER.filter((b) => pl.buildings[b] && BUILDINGS[b].income).length *
        3,
    0,
  );
  return resources + military + territory + income;
}
