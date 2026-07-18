import type { Planet, Player } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { computeHoldProbability } from './compute-hold-probability';
import { getOwnedPlanets } from './get-owned-planets';

export const computeDesiredGarrison = (
  player: Player,
  planet: Planet,
): number =>
  4 +
  Math.min(11, Math.floor(getTurn() / 3)) +
  match(getOwnedPlanets(player).length)
    .with(1, () => 4)
    .otherwise(() => 0) +
  match(planet.buildings.SILO)
    .when(Boolean, () => 4)
    .otherwise(() => 0) +
  Math.round((1 - computeHoldProbability(player, planet, planet.troops)) * 10);
