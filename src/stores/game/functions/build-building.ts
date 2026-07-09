import { buildingCost, BUILDINGS } from '@/game/config/constants';
import { floatText } from '@/game/hooks';
import type { BuildingType, GameState, Planet, Player } from '@/game/types';

import { log } from '@/stores/game/functions/log';
import { payCost } from '@/stores/game/functions/pay-cost';
import { techLevel } from '@/stores/game/functions/tech-level';

// Called from the draft when a building card is picked: pay the cost, then
// Build or upgrade it (validated in canPickCard).
export function buildBuilding(
  state: GameState,
  p: Player,
  planet: Planet,
  id: BuildingType,
): void {
  const techBefore = techLevel(state, p);
  const lvl = (planet.buildings[id] || 0) + 1;
  payCost(p, buildingCost(id, lvl));
  planet.buildings[id] = lvl;
  const verb =
    lvl > 1
      ? `upgrades ${BUILDINGS[id].icon} ${BUILDINGS[id].name} to level ${lvl}`
      : `builds ${BUILDINGS[id].icon} ${BUILDINGS[id].name}`;
  log(state, `🏗️ ${p.name} ${verb} on ${planet.name}`, 'build');
  floatText(
    planet,
    `${BUILDINGS[id].icon} ${BUILDINGS[id].name}${lvl > 1 ? ` L${lvl}` : ''}`,
    '#7dff8a',
  );
  const techAfter = techLevel(state, p);
  if (techAfter > techBefore) {
    log(
      state,
      `🔬 ${p.name} reaches TECHNOLOGY ${techAfter} — level-${techAfter} upgrades unlocked, and they now draft before lower-tech rivals!`,
      'sys',
    );
  }
}
