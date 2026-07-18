import type { Planet, Player } from '@seven-planets/game';
import { getBuildingLevel } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { computeGarrisonFloor } from './compute-garrison-floor';
import { computeImmediateFallProbability } from './compute-immediate-fall-probability';
import { getOwnedPlanets } from './get-owned-planets';
import { getPlan } from './get-plan';
import { getPlannedStagingPlanet } from './get-planned-staging-planet';
import { hasBuilding } from './has-building';
import type { MastermindDecision } from './mastermind-decision';

const findDonor = (
  player: Player,
  ownedPlanets: Planet[],
  excluded: Planet,
  troopFloor: number,
  safeOnly: boolean,
): Planet | undefined =>
  ownedPlanets
    .filter(
      (planet) =>
        planet !== excluded &&
        getBuildingLevel(planet, 'SPACEPORT') > 0 &&
        planet.troops > troopFloor + 2 &&
        (!safeOnly || computeImmediateFallProbability(player, planet) < 0.2),
    )
    .toSorted(
      (firstPlanet, secondPlanet) => secondPlanet.troops - firstPlanet.troops,
    )
    .at(0);

const getRescueMove = (player: Player): MastermindDecision | null =>
  chain({
    ownedPlanets: getOwnedPlanets(player),
    troopFloor: computeGarrisonFloor(),
  })
    .thru(
      ({ ownedPlanets, troopFloor }) =>
        ownedPlanets
          .filter(
            (planet) => computeImmediateFallProbability(player, planet) >= 0.3,
          )
          .toSorted(
            (firstPlanet, secondPlanet) =>
              computeImmediateFallProbability(player, secondPlanet) -
              computeImmediateFallProbability(player, firstPlanet),
          )
          .flatMap((destination) =>
            match(
              findDonor(player, ownedPlanets, destination, troopFloor, true),
            )
              .with(nullish, (): MastermindDecision[] => [])
              .otherwise((donor) =>
                match(
                  Math.min(getRocketCapacity(donor), donor.troops - troopFloor),
                )
                  .when(
                    (troopsToMove) => troopsToMove >= 1,
                    (troopsToMove): MastermindDecision[] => [
                      {
                        kind: 'move',
                        from: donor,
                        to: destination,
                        n: troopsToMove,
                      },
                    ],
                  )
                  .otherwise((): MastermindDecision[] => []),
              ),
          )
          .at(0) ?? null,
    )
    .value();

const getStagingMove = (player: Player): MastermindDecision | null =>
  chain({
    ownedPlanets: getOwnedPlanets(player),
    troopFloor: computeGarrisonFloor(),
    plan: getPlan(player),
    staging: getPlannedStagingPlanet(player),
  })
    .thru(({ ownedPlanets, troopFloor, plan, staging }) =>
      match(staging)
        .with(nullish, () => null)
        .when(
          (candidate) =>
            candidate.ownerId !== player.id ||
            candidate.troops >= Math.max(plan.troopsNeeded, troopFloor + 4),
          () => null,
        )
        .otherwise((stagingPlanet) =>
          match(
            findDonor(player, ownedPlanets, stagingPlanet, troopFloor, false),
          )
            .with(nullish, () => null)
            .otherwise((donor) =>
              match(
                Math.min(getRocketCapacity(donor), donor.troops - troopFloor),
              )
                .when(
                  (troopsToStage) => troopsToStage >= 2,
                  (troopsToStage): MastermindDecision => ({
                    kind: 'move',
                    from: donor,
                    to: stagingPlanet,
                    n: troopsToStage,
                  }),
                )
                .otherwise(() => null),
            ),
        ),
    )
    .value();

export const getMoveDecision = (player: Player): MastermindDecision | null =>
  match(
    (player.hand.MOVE || 0) > 0 &&
      hasBuilding(player, 'SPACEPORT') &&
      getOwnedPlanets(player).length >= 2,
  )
    .with(false, () => null)
    .otherwise(() => getRescueMove(player) ?? getStagingMove(player));
