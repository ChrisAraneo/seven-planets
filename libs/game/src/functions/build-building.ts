import { buildingCost, BUILDINGS } from '../config/constants';
import { floatText } from '../hooks';
import type { BuildingType } from '../interfaces/building-type';
import type { GameState } from '../interfaces/game-state';

import { log } from './log';
import { payCost } from './pay-cost';
import { techLevel } from './tech-level';
import { updatePlanet } from './update-planet';

// Called from the draft when a building card is picked: pay the cost, then
// Build or upgrade it (validated in canPickCard). Pure: returns a new state.
export function buildBuilding(
  state: GameState,
  playerId: number,
  planetId: number,
  id: BuildingType,
): GameState {
  const techBefore = techLevel(state, state.players[playerId]);
  const lvl = (state.planets[planetId].buildings[id] || 0) + 1;
  let s = payCost(state, playerId, buildingCost(id, lvl));
  s = updatePlanet(s, planetId, (planet) => ({
    ...planet,
    buildings: { ...planet.buildings, [id]: lvl },
  }));
  const verb =
    lvl > 1
      ? `upgrades ${BUILDINGS[id].icon} ${BUILDINGS[id].name} to level ${lvl}`
      : `builds ${BUILDINGS[id].icon} ${BUILDINGS[id].name}`;
  s = log(s, `🏗️ ${s.players[playerId].name} ${verb} on ${s.planets[planetId].name}`, 'build');
  floatText(
    s.planets[planetId],
    `${BUILDINGS[id].icon} ${BUILDINGS[id].name}${lvl > 1 ? ` L${lvl}` : ''}`,
    '#7dff8a',
  );
  const techAfter = techLevel(s, s.players[playerId]);
  if (techAfter > techBefore) {
    s = log(
      s,
      `🔬 ${s.players[playerId].name} reaches TECHNOLOGY ${techAfter} — level-${techAfter} upgrades unlocked, and they now draft before lower-tech rivals!`,
      'sys',
    );
  }
  return s;
}
