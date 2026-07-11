import { chain } from 'lodash-es';
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
export function currentGoal(state: GameState, p: Player): BuildGoal | null {
  return match(singularityReadyPlanet(state, p))
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
    .otherwise(() => nextBuildGoal(state, p));
}

function nextBuildGoal(state: GameState, p: Player): BuildGoal | null {
  return chain(getTechLevel(state, p))
    .thru(
      (tech) =>
        PRIORITIES
          // SINGULARITY handled above — needs a Lab of the same level
          .filter((id) => id !== 'SINGULARITY')
          .map((id) => buildGoalFor(state, p, id, tech))
          .find((goal) => goal !== undefined) ?? null,
    )
    .value();
}

function buildGoalFor(
  state: GameState,
  p: Player,
  id: BuildingType,
  tech: number,
): BuildGoal | undefined {
  return chain(Math.min(maxLevel(id), tech))
    .thru((cap) =>
      ownedPlanets(state, p).find((x) => (x.buildings[id] || 0) < cap),
    )
    .thru((planet) =>
      match(planet)
        .with(nullish, (): BuildGoal | undefined => undefined)
        .otherwise((pl) => ({
          id,
          planet: pl,
          cost: buildingCost(id, (pl.buildings[id] || 0) + 1),
        })),
    )
    .value();
}
