import { chain } from 'lodash-es';
import { match } from 'ts-pattern';
import { buildingCost, BUILDINGS, NO_PRESENTATION } from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';

import { log } from './log';
import { payCost } from './pay-cost';
import { getTechLevel } from './get-tech-level';
import { updatePlanet } from './update-planet';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

export function buildBuilding(
  state: GameState,
  playerId: number,
  planetId: number,
  buildingType: BuildingType,
  hooks: PresentationHooks = NO_PRESENTATION,
): GameState {
  return chain({
    currentTech: getTechLevel(state, state.players[playerId]),
    level: (state.planets[planetId].buildings[buildingType] || 0) + 1,
  })
    .thru(({ currentTech, level }) => ({
      currentTech,
      level,
      state: updatePlanet(
        payCost(state, playerId, buildingCost(buildingType, level)),
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
        `🏗️ ${built.players[playerId].name} ${buildVerb(buildingType, level)} on ${built.planets[planetId].name}`,
        'build',
      ),
    }))
    .tap(({ level, state: logged }) =>
      hooks.floatText(
        logged.planets[planetId],
        `${BUILDINGS[buildingType].icon} ${BUILDINGS[buildingType].name}${levelSuffix(level)}`,
        '#7dff8a',
      ),
    )
    .thru(({ currentTech, state: logged }) =>
      logTechAdvance(logged, playerId, currentTech),
    )
    .value();
}

function buildVerb(buildingType: BuildingType, level: number): string {
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

function levelSuffix(level: number): string {
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
