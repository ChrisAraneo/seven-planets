import type { Planet, Player } from '@/game/types';
import { getState } from '../state';

export function homePlanet(p: Player): Planet {
  return getState().planets[p.planets[0]];
}
