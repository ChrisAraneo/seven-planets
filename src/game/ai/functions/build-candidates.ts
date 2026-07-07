import { BUILD_ORDER, buildingCost } from '@/game/constants';
import type {
  BuildingType,
  Cost,
  GameState,
  Planet,
  Player,
} from '@/game/types';
import { aiState } from './ai-state';
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

export function buildCandidates(s: GameState, p: Player): BuildCandidate[] {
  const all: BuildCandidate[] = [];
  for (const planet of owned(s, p)) {
    for (const id of BUILD_ORDER) {
      const level = nextLevelAllowed(s, p, planet, id);
      if (!level) {
        continue;
      }
      const cost = buildingCost(id, level);
      const worth = buildingWorth(s, p, id, planet, level);
      if (worth <= 0) {
        continue;
      }
      const eta = affordEta(s, p, cost);
      const pComplete =
        cardAppearProb(s, id, aiState.W.planHorizon) *
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
