import type { BuildingType, Cost, Planet, Player } from '@seven-planets/game';
import { BUILD_ORDER, computeBuildingCost } from '@seven-planets/game';
import { uniqBy } from 'lodash-es';
import { match } from 'ts-pattern';

import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { computeBuildingWorth } from './compute-building-worth';
import { computeCardAppearProbability } from './compute-card-appear-probability';
import { computeTurnsToAfford } from './compute-turns-to-afford';
import { getNextAllowedLevel } from './get-next-allowed-level';
import { getOwnedPlanets } from './get-owned-planets';

export interface BuildCandidate {
  id: BuildingType;
  planet: Planet;
  level: number;
  cost: Cost;
  worth: number;
  pComplete: number;
}

const createBuildCandidate = (
  player: Player,
  planet: Planet,
  buildingType: BuildingType,
): BuildCandidate | null =>
  match(getNextAllowedLevel(player, planet, buildingType))
    .with(0, () => null)
    .otherwise((level) =>
      chain({
        cost: computeBuildingCost(buildingType, level),
        worth: computeBuildingWorth(player, buildingType, planet, level),
      })
        .thru(({ cost, worth }) =>
          match(worth <= 0)
            .with(true, () => null)
            .otherwise(() => ({
              id: buildingType,
              planet,
              level,
              cost,
              worth,
              pComplete:
                computeCardAppearProbability(
                  buildingType,
                  getAiState().weights.planHorizon,
                ) *
                Math.max(
                  0.1,
                  Math.min(
                    1,
                    1.2 -
                      computeTurnsToAfford(player, cost) /
                        getAiState().weights.planHorizon,
                  ),
                ),
            })),
        )
        .value(),
    );

export const getBuildCandidates = (player: Player): BuildCandidate[] =>
  chain(
    getOwnedPlanets(player).flatMap((planet) =>
      BUILD_ORDER.flatMap((buildingType) =>
        match(createBuildCandidate(player, planet, buildingType))
          .with(nullish, (): BuildCandidate[] => [])
          .otherwise((candidate) => [candidate]),
      ),
    ),
  )
    .thru((candidates) =>
      candidates.toSorted(
        (candidate, otherCandidate) =>
          otherCandidate.worth * otherCandidate.pComplete -
          candidate.worth * candidate.pComplete,
      ),
    )
    .thru((sorted) => uniqBy(sorted, (candidate) => candidate.id).slice(0, 5))
    .value();
