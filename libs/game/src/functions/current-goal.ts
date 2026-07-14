import { chain } from '../utils/chain';
import { match, P } from 'ts-pattern';
import { buildingCost, maxLevel, PRIORITIES } from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';
import type { Cost } from '../interfaces/cost';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';
import type { Player } from '../interfaces/player';

import { ownedPlanets } from './owned-planets';
import { singularityReadyPlanet } from '../functions/singularity-ready-planet';
import { getTechLevel } from './get-tech-level';

const { nonNullable, nullish } = P;

interface BuildGoal {
  id: BuildingType;
  planet: Planet;
  cost: Cost;
}

// The next thing this player is saving for (used for drafting, trading, refusals).
export function currentGoal(
  state: GameState,
  player: Player,
): BuildGoal | null {
  return match(singularityReadyPlanet(state, player))
    .with(
      nonNullable,
      (readyPl): BuildGoal => ({
        id: 'SINGULARITY',
        planet: readyPl,
        cost: buildingCost(
          'SINGULARITY',
          (readyPl.buildings.SINGULARITY || 0) + 1,
        ),
      }),
    )
    .otherwise(() => nextBuildGoal(state, player));
}

function nextBuildGoal(state: GameState, player: Player): BuildGoal | null {
  return chain(getTechLevel(state, player))
    .thru(
      (tech) =>
        PRIORITIES
          // SINGULARITY handled above — needs a Lab of the same level
          .filter((id) => id !== 'SINGULARITY')
          .map((id) => buildGoalFor(state, player, id, tech))
          .find((goal) => goal !== undefined) ?? null,
    )
    .value();
}

function buildGoalFor(
  state: GameState,
  player: Player,
  id: BuildingType,
  tech: number,
): BuildGoal | undefined {
  return chain(Math.min(maxLevel(id), tech))
    .thru((cap) =>
      ownedPlanets(state, player).find(
        (planet) => (planet.buildings[id] || 0) < cap,
      ),
    )
    .thru((planet) =>
      match(planet)
        .with(nullish, (): BuildGoal | undefined => undefined)
        .otherwise((eachPlanet) => ({
          id,
          planet: eachPlanet,
          cost: buildingCost(id, (eachPlanet.buildings[id] || 0) + 1),
        })),
    )
    .value();
}
