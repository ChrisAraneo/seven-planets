import { BUILDINGS, buildingCost } from '@/game/constants';
import { floatText } from '@/game/effects';
import type { BuildingType, Planet, Player } from '@/game/types';
import { log } from './log';
import { payCost } from './pay-cost';
import { techLevel } from './tech-level';

// Called from the draft when a building card is picked: pay the cost, then
// Build or upgrade it (validated in canPickCard).
export function buildBuilding(
  p: Player,
  planet: Planet,
  id: BuildingType,
): void {
  const techBefore = techLevel(p);
  const lvl = (planet.buildings[id] || 0) + 1;
  payCost(p, buildingCost(id, lvl));
  planet.buildings[id] = lvl;
  const verb =
    lvl > 1
      ? `upgrades ${BUILDINGS[id].icon} ${BUILDINGS[id].name} to level ${lvl}`
      : `builds ${BUILDINGS[id].icon} ${BUILDINGS[id].name}`;
  log(`🏗️ ${p.name} ${verb} on ${planet.name}`, 'build');
  floatText(
    planet,
    `${BUILDINGS[id].icon} ${BUILDINGS[id].name}${lvl > 1 ? ` L${lvl}` : ''}`,
    '#7dff8a',
  );
  const techAfter = techLevel(p);
  if (techAfter > techBefore) {
    log(
      `🔬 ${p.name} reaches TECHNOLOGY ${techAfter} — level-${techAfter} upgrades unlocked, and they now draft before lower-tech rivals!`,
      'sys',
    );
  }
}
