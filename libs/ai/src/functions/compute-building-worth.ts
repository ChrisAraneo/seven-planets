import type { BuildingType, Planet, Player } from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';
import { getTurn } from '@seven-planets/game';
import {
  BASE_ROCKET_CAP,
  BUILDINGS,
  CARDS,
  computeBuildingCost,
  computeHandValue,
  computeIncomeAmount,
  getMaxLevel,
  SHIELD_DEFENSE,
  SILO_HIT_BONUS,
  SINGULARITY_DEF_BONUS,
} from '@seven-planets/game';
import { computeRecruitYield } from '@seven-planets/game';
import { getRocketCapacity } from '@seven-planets/game';
import { match } from 'ts-pattern';

import { getPlayerByIndex } from '../../../game/src/getters/get-player-by-index';
import { getAiState } from '../state';
import { chain } from '../utils/chain';
import { nullish } from '../utils/p';
import { STAR_VALUE } from './ai-constants';
import { computeAverageResourceCardValue } from './compute-average-resource-card-value';
import { computeHoldProbability } from './compute-hold-probability';
import { computeMinimumTroopsToConquer } from './compute-minimum-troops-to-conquer';
import { computePlanetValue } from './compute-planet-value';
import { computeTotalTroops } from './compute-total-troops';
import { getOwnedPlanets } from './get-owned-planets';
import { hasBuilding } from './has-building';
import { isUnderTruce } from './is-under-truce';

const computeIncomeWorth = (
  player: Player,
  buildingType: BuildingType,
  level: number,
): number =>
  match(BUILDINGS[buildingType].income)
    .with(nullish, () => 0)
    .otherwise(
      (incomeResource) =>
        (computeIncomeAmount(buildingType, level) -
          computeIncomeAmount(buildingType, level - 1)) *
        CARDS[incomeResource].value *
        getAiState().W.buildRoiHorizon *
        match(incomeResource)
          .with('SPICE', () =>
            match(hasBuilding(player, 'LAB'))
              .with(true, () => 0.6)
              .otherwise(() => 0.3),
          )
          .otherwise(() => 1),
    );

const computeBarracksWorth = (
  player: Player,
  planet: Planet,
  level: number,
): number =>
  chain(getAiState().W.buildRoiHorizon)
    .thru(
      (roiHorizon) =>
        match(hasBuilding(player, 'BARRACKS'))
          .with(false, () => roiHorizon + 6)
          .otherwise(() =>
            match(level)
              .with(1, () => 3)
              .otherwise(
                () =>
                  (computeRecruitYield({
                    ...planet,
                    buildings: { BARRACKS: level },
                  }) -
                    computeRecruitYield(planet)) *
                  roiHorizon *
                  0.5,
              ),
          ) +
        match(planet.buildings.SILO)
          .when(Boolean, () => 3)
          .otherwise(() => 0),
    )
    .value();

const computeCapacityUnlockWorth = (
  player: Player,
  planet: Planet,
  level: number,
): number =>
  chain(
    getGameStateLastValue().planets.reduce(
      (minimum, targetPlanet) =>
        match(
          targetPlanet.ownerId !== player.id &&
            Boolean(getPlayerByIndex(targetPlanet.ownerId)?.isAlive) &&
            !isUnderTruce(targetPlanet),
        )
          .with(true, () =>
            Math.min(
              minimum,
              computeMinimumTroopsToConquer(targetPlanet.troops),
            ),
          )
          .otherwise(() => minimum),
      Infinity,
    ),
  )
    .thru((minimumTroopsNeeded) =>
      match(
        minimumTroopsNeeded !== Infinity &&
          getRocketCapacity(planet) < minimumTroopsNeeded &&
          match(level >= 3)
            .with(true, () => Infinity)
            .otherwise(() => BASE_ROCKET_CAP * 2 ** level) >=
            minimumTroopsNeeded,
      )
        .with(true, () => 7)
        .otherwise(() => 0),
    )
    .value();

const computeSiloWorth = (
  player: Player,
  planet: Planet,
  level: number,
): number =>
  match(player.hasPacifistStatus)
    .with(true, () => 0)
    .otherwise(
      () =>
        match(hasBuilding(player, 'SILO'))
          .with(true, () => 2 + SILO_HIT_BONUS * 0.8 + level)
          .otherwise(
            () => getAiState().W.buildRoiHorizon * 0.7 + getTurn() / 10,
          ) +
        match(planet.buildings.BARRACKS)
          .when(Boolean, () => 3)
          .otherwise(() => 0) +
        match(hasBuilding(player, 'SILO'))
          .with(true, () => computeCapacityUnlockWorth(player, planet, level))
          .otherwise(() => 0),
    );

const computeShieldWorth = (
  player: Player,
  planet: Planet,
  level: number,
): number =>
  (SHIELD_DEFENSE[level] - SHIELD_DEFENSE[level - 1]) * 0.35 +
  (1 - computeHoldProbability(player, planet, planet.troops)) *
    computePlanetValue(planet) *
    0.6;

const computeSpacepor2rth = (player: Player, level: number): number =>
  match(getOwnedPlanets(player).length >= 2)
    .with(false, () => 0.5)
    .otherwise(
      () =>
        match(level)
          .with(1, () => 4)
          .otherwise(() => 2.5) +
        match(hasBuilding(player, 'SPACEPORT'))
          .with(true, () => 0)
          .otherwise(() =>
            match(
              getOwnedPlanets(player).filter(
                (ownedPlanet) => ownedPlanet.buildings.SILO,
              ),
            )
              .when(
                (silos) => silos.length === 0,
                () => 0,
              )
              .otherwise((silos) =>
                Math.min(
                  6,
                  (computeTotalTroops(player) -
                    silos.reduce(
                      (maxTroops, siloPlanet) =>
                        Math.max(maxTroops, siloPlanet.troops),
                      0,
                    )) *
                    0.4,
                ),
              ),
          ),
    );

const computeSpecialWorth = (
  player: Player,
  buildingType: BuildingType,
  planet: Planet,
  level: number,
): number =>
  match(buildingType)
    .with('BARRACKS', () => computeBarracksWorth(player, planet, level))
    .with('SILO', () => computeSiloWorth(player, planet, level))
    .with('SHIELD', () => computeShieldWorth(player, planet, level))
    .with('SPACEPORT', () => computeSpacepor2rth(player, level))
    .with('EMBASSY', () =>
      match(level)
        .with(1, () => 3.5)
        .otherwise(() => STAR_VALUE * getAiState().W.buildRoiHorizon * 0.7),
    )
    .with('LAB', () =>
      match(level <= getMaxLevel('SINGULARITY'))
        .with(true, () => 6 + level)
        .otherwise(() => 1),
    )
    .with(
      'SINGULARITY',
      () =>
        computeAverageResourceCardValue() * getAiState().W.buildRoiHorizon +
        5 +
        match(level >= 4)
          .with(true, () => SINGULARITY_DEF_BONUS * 0.6)
          .otherwise(() => 0),
    )
    .otherwise(() => 0);

export const computeBuildingWorth = (
  player: Player,
  buildingType: BuildingType,
  planet: Planet,
  level: number,
): number =>
  computeIncomeWorth(player, buildingType, level) +
  computeSpecialWorth(player, buildingType, planet, level) -
  computeHandValue(computeBuildingCost(buildingType, level));
