import type { Planet, Player } from '@seven-planets/game';
import { getBuildingLevel } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { canRecruitAt } from './can-recruit-at';
import { computeDesiredGarrison } from './compute-desired-garrison';
import { computeImmediateFallProbability } from './compute-immediate-fall-probability';
import { getOwnedPlanets } from './get-owned-planets';
import { getPlan } from './get-plan';
import { getPlannedStagingPlanet } from './get-planned-staging-planet';
import type { MastermindDecision } from './mastermind-decision';

const findFallbackRecruit = (
  player: Player,
  ownedPlanets: Planet[],
): MastermindDecision | null =>
  match(
    ownedPlanets
      .filter((planet) => canRecruitAt(player, planet))
      .toSorted(
        (firstPlanet, secondPlanet) =>
          getBuildingLevel(secondPlanet, 'BARRACKS') -
          getBuildingLevel(firstPlanet, 'BARRACKS'),
      )
      .at(0),
  )
    .with(nullish, () => null)
    .otherwise(
      (anyRecruitable): MastermindDecision => ({
        kind: 'recruit',
        planet: anyRecruitable,
      }),
    );

const getStagingRecruit = (
  player: Player,
  ownedPlanets: Planet[],
): MastermindDecision | null =>
  chain({ plan: getPlan(player), staging: getPlannedStagingPlanet(player) })
    .thru(({ plan, staging }) =>
      match(staging)
        .with(nullish, () => null)
        .when(
          (candidate) =>
            !(
              plan.kind === 'MILITARIZE' ||
              plan.kind === 'STRIKE' ||
              ((player.hand.ATTACK || 0) > 0 && plan.stagingId !== null)
            ) ||
            candidate.ownerId !== player.id ||
            candidate.troops >=
              Math.max(
                plan.troopsNeeded,
                computeDesiredGarrison(player, candidate),
              ),
          () => null,
        )
        .when(
          (candidate) => canRecruitAt(player, candidate),
          (candidate): MastermindDecision => ({
            kind: 'recruit',
            planet: candidate,
          }),
        )
        .otherwise(() => findFallbackRecruit(player, ownedPlanets)),
    )
    .value();

const getThinnestRecruit = (
  player: Player,
  ownedPlanets: Planet[],
): MastermindDecision | null =>
  match(
    ownedPlanets
      .filter(
        (planet) =>
          canRecruitAt(player, planet) &&
          planet.troops < computeDesiredGarrison(player, planet),
      )
      .toSorted(
        (firstPlanet, secondPlanet) =>
          firstPlanet.troops -
          computeDesiredGarrison(player, firstPlanet) -
          (secondPlanet.troops - computeDesiredGarrison(player, secondPlanet)),
      )
      .at(0),
  )
    .with(nullish, () => null)
    .otherwise(
      (thinnestPlanet): MastermindDecision => ({
        kind: 'recruit',
        planet: thinnestPlanet,
      }),
    );

const findRecruitTarget = (
  player: Player,
  ownedPlanets: Planet[],
): MastermindDecision | null =>
  match(
    ownedPlanets
      .filter(
        (planet) =>
          canRecruitAt(player, planet) &&
          computeImmediateFallProbability(player, planet) >= 0.2,
      )
      .toSorted(
        (firstPlanet, secondPlanet) =>
          computeImmediateFallProbability(player, secondPlanet) -
          computeImmediateFallProbability(player, firstPlanet),
      )
      .at(0),
  )
    .with(
      nullish,
      () =>
        getStagingRecruit(player, ownedPlanets) ??
        getThinnestRecruit(player, ownedPlanets),
    )
    .otherwise(
      (endangered): MastermindDecision => ({
        kind: 'recruit',
        planet: endangered,
      }),
    );

export const getRecruitDecision = (player: Player): MastermindDecision | null =>
  match((player.hand.RECRUIT || 0) < 1)
    .with(true, () => null)
    .otherwise(() =>
      chain(getOwnedPlanets(player))
        .thru((ownedPlanets) => findRecruitTarget(player, ownedPlanets))
        .value(),
    );
