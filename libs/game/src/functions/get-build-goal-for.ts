import { match, P } from 'ts-pattern';

import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import { computeBuildingCost } from './compute-building-cost';
import type { BuildGoal } from './get-current-goal';
import { getMaxLevel } from './get-max-level';
import { getOwnedPlanets } from './get-owned-planets';

const { nullish } = P;
export const getBuildGoalFor = (
  state: GameState,
  player: Player,
  id: BuildingType,
  tech: number,
): BuildGoal | null =>
  chain(Math.min(getMaxLevel(id), tech))
    .thru((capacity) =>
      getOwnedPlanets(state, player).find(
        (planet) => (planet.buildings[id] || 0) < capacity,
      ),
    )
    .thru((planet) =>
      match(planet)
        .with(nullish, (): BuildGoal | null => null)
        .otherwise((eachPlanet) => ({
          id,
          planet: eachPlanet,
          cost: computeBuildingCost(id, (eachPlanet.buildings[id] || 0) + 1),
        })),
    )
    .value();
