import { chain } from '../utils/chain';
import { match } from 'ts-pattern';
import { computeBuildingCost, BUILDINGS } from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';

import { emitEffect } from './emit-effect';
import { log } from './log';
import { payCost } from './pay-cost';
import { getTechLevel } from './get-tech-level';
import { updatePlanet } from './update-planet';

export function buildBuilding(
  state: GameState,
  playerId: number,
  planetId: number,
  buildingType: BuildingType,
): GameState {
  return chain({
    currentTech: getTechLevel(state, state.players[playerId]),
    level: (state.planets[planetId].buildings[buildingType] || 0) + 1,
  })
    .thru(({ currentTech, level }) => ({
      currentTech,
      level,
      state: updatePlanet(
        payCost(state, playerId, computeBuildingCost(buildingType, level)),
        planetId,
        (planet) => ({
          ...planet,
          buildings: { ...planet.buildings, [buildingType]: level },
        }),
      ),
    }))
    .thru(({ currentTech, level, state: built }) => ({
      currentTech,
      level,
      state: log(
        built,
        `🏗️ ${built.players[playerId].name} ${getBuildVerb(buildingType, level)} on ${built.planets[planetId].name}`,
        'build',
      ),
    }))
    .thru(({ currentTech, level, state: logged }) => ({
      currentTech,
      state: emitEffect(logged, {
        kind: 'floatText',
        planetId,
        text: `${BUILDINGS[buildingType].icon} ${BUILDINGS[buildingType].name}${getLevelSuffix(level)}`,
        color: '#7dff8a',
      }),
    }))
    .thru(({ currentTech, state: logged }) =>
      logTechAdvance(logged, playerId, currentTech),
    )
    .value();
}

function getBuildVerb(buildingType: BuildingType, level: number): string {
  return match(level)
    .when(
      (level) => level > 1,
      (level) =>
        `upgrades ${BUILDINGS[buildingType].icon} ${BUILDINGS[buildingType].name} to level ${level}`,
    )
    .otherwise(
      () =>
        `builds ${BUILDINGS[buildingType].icon} ${BUILDINGS[buildingType].name}`,
    );
}

function getLevelSuffix(level: number): string {
  return match(level)
    .when(
      (level) => level > 1,
      (level) => ` L${level}`,
    )
    .otherwise(() => '');
}

function logTechAdvance(
  state: GameState,
  playerId: number,
  previousTech: number,
): GameState {
  return match(getTechLevel(state, state.players[playerId]))
    .when(
      (updatedTech) => updatedTech > previousTech,
      (updatedTech) =>
        log(
          state,
          `🔬 ${state.players[playerId].name} reaches TECHNOLOGY ${updatedTech} — level-${updatedTech} upgrades unlocked, and they now draft before lower-tech rivals!`,
          'sys',
        ),
    )
    .otherwise(() => state);
}
