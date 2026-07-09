import { buildingCost, maxLevel, PRIORITIES } from '@/game/constants';
import type { BuildingType, Cost, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { owned } from './owned';
import { techLevel } from './tech-level';

export function rivalGoalBuilding(
  r: Player,
): { id: BuildingType; cost: Cost } | null {
  const s = getGameState();
  const prio = PRIORITIES.mastermind;
  const tech = techLevel(r);
  for (const id of prio) {
    if (id === 'SINGULARITY') {
      continue;
    }
    const cap = Math.min(maxLevel(id), tech);
    const pl = owned(r).find((x) => (x.buildings[id] || 0) < cap);
    if (pl) {
      return { id, cost: buildingCost(id, (pl.buildings[id] || 0) + 1) };
    }
  }
  return null;
}
