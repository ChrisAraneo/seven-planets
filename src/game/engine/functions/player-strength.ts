// NOTE: This function is not used anywhere in the current codebase.
// Only referenced by ai-pick-attack and ai-pick-influence-play, both of which are unused.
import { BUILD_ORDER, BUILDINGS, handValue } from '@/game/constants';
import type { Player } from '@/game/types';
import { ownedPlanets } from './owned-planets';
import { totalTroops } from './total-troops';

// Composite strength score used for anti-kingmaker trade logic and opportunist targeting.
export function playerStrength(p: Player): number {
  const resources = handValue(p.hand);
  const military = totalTroops(p) * 1.5;
  const territory = p.planets.length * 8;
  const income = ownedPlanets(p).reduce(
    (s, pl) =>
      s +
      BUILD_ORDER.filter((b) => pl.buildings[b] && BUILDINGS[b].income).length *
        3,
    0,
  );
  return resources + military + territory + income;
}
