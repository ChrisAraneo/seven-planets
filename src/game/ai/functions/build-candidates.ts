import { BUILD_ORDER, buildingCost } from '@/game/constants';
import type { BuildingType, Cost, Planet, Player } from '@/game/types';
import { getAiStore } from '@/stores/ai';
import { getGameState } from '@/stores/game-state';

import { affordEta } from './afford-eta';
import { buildingWorth } from './building-worth';
import { cardAppearProb } from './card-appear-prob';
import { nextLevelAllowed } from './next-level-allowed';
import { owned } from './owned';

export interface BuildCandidate {
  id: BuildingType;
  planet: Planet;
  level: number;
  cost: Cost;
  worth: number;
  pComplete: number;
}

export function buildCandidates(p: Player): BuildCandidate[] {
  const aiState = getAiStore();
  const s = getGameState();
  const all: BuildCandidate[] = [];
  for (const planet of owned(p)) {
    for (const id of BUILD_ORDER) {
      const level = nextLevelAllowed(p, planet, id);
      if (!level) {
        continue;
      }
      const cost = buildingCost(id, level);
      const worth = buildingWorth(p, id, planet, level);
      if (worth <= 0) {
        continue;
      }
      const eta = affordEta(p, cost);
      const pComplete =
        cardAppearProb(id, aiState.W.planHorizon) *
        Math.max(0.1, Math.min(1, 1.2 - eta / aiState.W.planHorizon));
      all.push({ id, planet, level, cost, worth, pComplete });
    }
  }
  all.sort((a, b) => b.worth * b.pComplete - a.worth * a.pComplete);
  const queue: BuildCandidate[] = [];
  for (const c of all) {
    if (!queue.some((q) => q.id === c.id)) {
      queue.push(c);
    }
    if (queue.length >= 5) {
      break;
    }
  }
  return queue;
}
