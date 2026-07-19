import type {
  BuildingType,
  Planet,
  Player,
  PoolType,
} from '@seven-planets/game';
import {
  canAfford,
  CARDS,
  isBuildingType,
  isInfluenceType,
} from '@seven-planets/game';
import { computeBuildingCost } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { computeBuildingWorth } from './compute-building-worth';
import { computeGarrisonFloor } from './compute-garrison-floor';
import { computeHandAfterCost } from './compute-hand-after-cost';
import { computeInfluenceDraftValue } from './compute-influence-draft-value';
import { computeTotalTroops } from './compute-total-troops';
import { getNextAllowedLevel } from './get-next-allowed-level';
import { getOwnedPlanets } from './get-owned-planets';
import { hasBuilding } from './has-building';
import type { Plan } from './plan-types';

const computeBuildingDraftValue = (
  player: Player,
  draftPlanet: Planet,
  buildingType: BuildingType,
  plan: Plan,
): number =>
  match(getNextAllowedLevel(player, draftPlanet, buildingType))
    .with(0, () => -1)
    .otherwise((level) =>
      chain(
        1.5 +
          computeBuildingWorth(player, buildingType, draftPlanet, level) / 6 +
          match(plan.buildQueue.at(0)?.id === buildingType)
            .with(true, () => 2)
            .otherwise(() =>
              match(
                plan.buildQueue.some(
                  (candidate) => candidate.id === buildingType,
                ),
              )
                .with(true, () => 1)
                .otherwise(() => 0),
            ),
      )
        .thru(
          (value) =>
            value -
            match(plan.buildQueue.at(0))
              .with(nullish, () => 0)
              .when(
                (head) =>
                  head.id !== buildingType &&
                  canAfford(player.hand, head.cost) &&
                  !canAfford(
                    computeHandAfterCost(
                      player.hand,
                      computeBuildingCost(buildingType, level),
                    ),
                    head.cost,
                  ),
                () => 2,
              )
              .otherwise(() => 0),
        )
        .value(),
    );

const computeAttackDraftValue = (player: Player, plan: Plan): number =>
  match(player.hasPacifistStatus)
    .with(true, () => -1)
    .otherwise(
      () =>
        1.2 +
        match(
          (plan.kind === 'STRIKE' || plan.kind === 'MILITARIZE') &&
            hasBuilding(player, 'SILO'),
        )
          .with(true, () => 1.6)
          .otherwise(() => 0) +
        match(
          (player.hand.ATTACK || 0) === 0 &&
            hasBuilding(player, 'SILO') &&
            computeTotalTroops(player) >= 4,
        )
          .with(true, () => 1)
          .otherwise(() => 0) -
        (player.hand.ATTACK || 0) * 0.5,
    );

const computeRecruitDraftValue = (player: Player, plan: Plan): number =>
  1.3 +
  match(
    hasBuilding(player, 'BARRACKS') &&
      getOwnedPlanets(player).some(
        (planet) => planet.troops < computeGarrisonFloor(),
      ),
  )
    .with(true, () => 1.5)
    .otherwise(() => 0) +
  Math.min(2.5, plan.threat * 0.4) +
  match(plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE')
    .with(true, () => 1.6)
    .otherwise(() => 0) -
  (player.hand.RECRUIT || 0) * 0.4;

const computeMoveDraftValue = (player: Player): number =>
  0.8 +
  match(getOwnedPlanets(player).length >= 2 && hasBuilding(player, 'SPACEPORT'))
    .with(true, () => 0.8)
    .otherwise(() => 0) -
  (player.hand.MOVE || 0) * 0.6;

const computeTradeDraftValue = (player: Player): number =>
  1 +
  match(hasBuilding(player, 'EMBASSY'))
    .with(true, () => 0.6)
    .otherwise(() => 0) -
  (player.hand.TRADE || 0) * 0.5;

const computeResourceDraftValue = (
  player: Player,
  poolType: PoolType,
  plan: Plan,
  baseValue: number,
): number =>
  baseValue +
  match(
    (plan.buildQueue.at(0)?.cost[poolType] || 0) > (player.hand[poolType] || 0),
  )
    .with(true, () => 1.6)
    .otherwise(() => 0) +
  match(
    (plan.kind === 'MILITARIZE' || plan.kind === 'STRIKE') &&
      poolType === 'ORE',
  )
    .with(true, () => 0.8)
    .otherwise(() => 0) +
  match(poolType)
    .with('RELIC', () => 0.3)
    .otherwise(() => 0) -
  Math.min(1.5, (player.hand[poolType] || 0) * 0.08);

export const computeOwnDraftValue = (
  player: Player,
  draftPlanet: Planet,
  poolType: PoolType,
  plan: Plan,
): number =>
  match(poolType)
    .when(isBuildingType, (buildingType) =>
      computeBuildingDraftValue(player, draftPlanet, buildingType, plan),
    )
    .when(isInfluenceType, (influenceType) =>
      computeInfluenceDraftValue(player, influenceType, plan),
    )
    .with('ATTACK', () => computeAttackDraftValue(player, plan))
    .with('RECRUIT', () => computeRecruitDraftValue(player, plan))
    .with('MOVE', () => computeMoveDraftValue(player))
    .with('TRADE', () => computeTradeDraftValue(player))
    .otherwise((resourceType) =>
      computeResourceDraftValue(
        player,
        resourceType,
        plan,
        CARDS[resourceType].value,
      ),
    );
