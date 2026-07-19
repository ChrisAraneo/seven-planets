import { match } from 'ts-pattern';

import type { BuildGoal } from '../../interfaces/build-goal';
import type { BuildingType } from '../../interfaces/building-type';
import type { GameState } from '../../interfaces/game-state';
import type { Player } from '../../interfaces/player';
import { chain } from '../../utils/chain';
import { nullish } from '../../utils/p';
import { computeBuildingCost } from '../compute-building-cost';
import { getBuildingLevel } from './get-building-level';
import { getMaxLevel } from './get-max-level';
import { getOwnedPlanets } from './get-owned-planets';

// TODO: rename to computeBuildGoal
export const getBuildGoalFor = (
  state: GameState,
  player: Player,
  id: BuildingType,
  tech: number,
): BuildGoal | null =>
  chain(Math.min(getMaxLevel(id), tech))
    .thru((capacity) =>
      getOwnedPlanets(state, player).find(
        (planet) => getBuildingLevel(planet, id) < capacity,
      ),
    )
    .thru((planet) =>
      match(planet)
        .with(nullish, (): BuildGoal | null => null)
        .otherwise((eachPlanet) => ({
          id,
          planet: eachPlanet,
          cost: computeBuildingCost(id, getBuildingLevel(eachPlanet, id) + 1),
        })),
    )
    .value();
