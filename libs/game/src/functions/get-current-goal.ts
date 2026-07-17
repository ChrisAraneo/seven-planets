import { match, P } from 'ts-pattern';

import {
  computeBuildingCost,
  getMaxLevel,
  PRIORITIES,
} from '../config/constants';
import { getSingularityReadyPlanet } from '../functions/get-singularity-ready-planet';
import type { BuildingType } from '../interfaces/building-type';
import type { Cost } from '../interfaces/cost';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import { getOwnedPlanets } from './get-owned-planets';
import { getTechLevel } from './get-tech-level';

const { nonNullable, nullish } = P;

interface BuildGoal {
  id: BuildingType;
  planet: Planet;
  cost: Cost;
}

export function getCurrentGoal(
  state: GameState,
  player: Player,
): BuildGoal | null {
  return match(getSingularityReadyPlanet(state, player))
    .with(
      nonNullable,
      (readyPl): BuildGoal => ({
        id: 'SINGULARITY',
        planet: readyPl,
        cost: computeBuildingCost(
          'SINGULARITY',
          (readyPl.buildings.SINGULARITY || 0) + 1,
        ),
      }),
    )
    .otherwise(() => getNextBuildGoal(state, player));
}

function getNextBuildGoal(state: GameState, player: Player): BuildGoal | null {
  return chain(getTechLevel(state, player))
    .thru(
      (tech) =>
        PRIORITIES.filter((id) => id !== 'SINGULARITY')
          .map((id) => getBuildGoalFor(state, player, id, tech))
          .find((goal) => goal !== null) ?? null,
    )
    .value();
}

function getBuildGoalFor(
  state: GameState,
  player: Player,
  id: BuildingType,
  tech: number,
): BuildGoal | null {
  return chain(Math.min(getMaxLevel(id), tech))
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
}
