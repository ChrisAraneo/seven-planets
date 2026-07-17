import { BUILDINGS } from '../config/constants';
import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { computeBuildingCost } from './compute-building-cost';
import { emitEffect } from './emit-effect';
import { getBuildVerb } from './get-build-verb';
import { getLevelSuffix } from './get-level-suffix';
import { getTechLevel } from './get-tech-level';
import { log } from './log';
import { logTechAdvance } from './log-tech-advance';
import { payCost } from './pay-cost';
import { updatePlanet } from './update-planet';

export const buildBuilding = (
  state: GameState,
  playerId: number,
  planetId: number,
  buildingType: BuildingType,
): GameState =>
  chain({
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
