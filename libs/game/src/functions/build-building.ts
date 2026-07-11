import { buildingCost, BUILDINGS } from '../config/constants';
import { floatText } from '../hooks';
import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';

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
  const techBefore = getTechLevel(state, state.players[playerId]);
  const level = (state.planets[planetId].buildings[buildingType] || 0) + 1;

  let updatedState = payCost(
    state,
    playerId,
    buildingCost(buildingType, level),
  );
  updatedState = updatePlanet(updatedState, planetId, (planet) => ({
    ...planet,
    buildings: { ...planet.buildings, [buildingType]: level },
  }));
  const verb =
    level > 1
      ? `upgrades ${BUILDINGS[buildingType].icon} ${BUILDINGS[buildingType].name} to level ${level}`
      : `builds ${BUILDINGS[buildingType].icon} ${BUILDINGS[buildingType].name}`;
  updatedState = log(
    updatedState,
    `🏗️ ${updatedState.players[playerId].name} ${verb} on ${updatedState.planets[planetId].name}`,
    'build',
  );
  floatText(
    updatedState.planets[planetId],
    `${BUILDINGS[buildingType].icon} ${BUILDINGS[buildingType].name}${level > 1 ? ` L${level}` : ''}`,
    '#7dff8a',
  );

  const techAfter = getTechLevel(updatedState, updatedState.players[playerId]);

  if (techAfter > techBefore) {
    updatedState = log(
      updatedState,
      `🔬 ${updatedState.players[playerId].name} reaches TECHNOLOGY ${techAfter} — level-${techAfter} upgrades unlocked, and they now draft before lower-tech rivals!`,
      'sys',
    );
  }

  return updatedState;
}
