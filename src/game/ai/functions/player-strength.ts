import { BUILD_ORDER, BUILDINGS, handValue } from '@/game/constants';
import type { GameState, Player } from '@/game/types';
import { owned } from './owned';
import { totalTroops } from './total-troops';

export function playerStrength(s: GameState, p: Player): number {
  const resources = handValue(p.hand);
  const military = totalTroops(s, p) * 1.5;
  const territory = p.planets.length * 8;
  const income = owned(s, p).reduce(
    (sum, pl) =>
      sum +
      BUILD_ORDER.filter((b) => pl.buildings[b] && BUILDINGS[b].income).length *
        3,
    0,
  );
  return resources + military + territory + income;
}
