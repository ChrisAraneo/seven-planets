import type { Planet, Player } from '@/game/types';
import { getState } from '../state';

export function ownedPlanets(p: Player): Planet[] {
  return p.planets.map((id) => getState().planets[id]);
}
