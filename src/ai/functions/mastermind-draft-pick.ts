import { getGameState } from '@/stores/game-state';
import { getAiState } from '@/ai/state';
import type { Planet, Player } from '@/game/types';

import { activateWeightsFor } from './activate-weights-for';
import { denialValue } from './denial-value';
import { ownDraftValue } from './own-draft-value';
import { planFor } from './plan-for';

export function mastermindDraftPick(
  p: Player,
  draftPlanet: Planet,
  pickable: boolean[],
): number {
  const aiState = getAiState();
  activateWeightsFor(p);
  if (
    aiState.randomPickChance > 0 &&
    Math.random() < aiState.randomPickChance
  ) {
    const options: number[] = [];
    for (let i = 0; i < getGameState().pool.length; i++) {
      if (pickable[i]) {
        options.push(i);
      }
    }
    if (options.length > 0) {
      return options[Math.floor(Math.random() * options.length)];
    }
  }
  const plan = planFor(p);
  let bestIdx = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < getGameState().pool.length; i++) {
    if (!pickable[i]) {
      continue;
    }
    const t = getGameState().pool[i];
    const copies = getGameState().pool.filter((x) => x === t).length;
    const score =
      ownDraftValue(p, draftPlanet, t, plan) +
      (denialValue(p, t) / copies) * aiState.W.denialWeight +
      Math.random() * 0.05;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestScore < -1 ? -1 : bestIdx;
}
