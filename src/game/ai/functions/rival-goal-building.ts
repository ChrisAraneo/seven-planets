import { buildingCost, maxLevel, PRIORITIES } from '@/game/constants';
import type { BuildingType, Cost, GameState, Player } from '@/game/types';
import { owned } from './owned';
import { techLevel } from './tech-level';

export function rivalGoalBuilding(
  s: GameState,
  r: Player,
): { id: BuildingType; cost: Cost } | null {
  const prio = PRIORITIES.mastermind;
  const tech = techLevel(s, r);
  for (const id of prio) {
    if (id === 'SINGULARITY') {
      continue;
    }
    const cap = Math.min(maxLevel(id), tech);
    const pl = owned(s, r).find((x) => (x.buildings[id] || 0) < cap);
    if (pl) {
      return { id, cost: buildingCost(id, (pl.buildings[id] || 0) + 1) };
    }
  }
  return null;
}
