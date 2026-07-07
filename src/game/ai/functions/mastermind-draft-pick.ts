import type { GameState, Planet, Player } from '@/game/types';
import { aiState } from './ai-state';
import { activateWeightsFor } from './activate-weights-for';
import { denialValue } from './denial-value';
import { ownDraftValue } from './own-draft-value';
import { planFor } from './plan-for';

export function mastermindDraftPick(
  s: GameState,
  p: Player,
  draftPlanet: Planet,
  pickable: boolean[],
): number {
  activateWeightsFor(p);
  if (
    aiState.randomPickChance > 0 &&
    Math.random() < aiState.randomPickChance
  ) {
    const options: number[] = [];
    for (let i = 0; i < s.pool.length; i++) {
      if (pickable[i]) {
        options.push(i);
      }
    }
    if (options.length > 0) {
      return options[Math.floor(Math.random() * options.length)];
    }
  }
  const plan = planFor(s, p);
  let bestIdx = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < s.pool.length; i++) {
    if (!pickable[i]) {
      continue;
    }
    const t = s.pool[i];
    const copies = s.pool.filter((x) => x === t).length;
    const score =
      ownDraftValue(s, p, draftPlanet, t, plan) +
      (denialValue(s, p, t) / copies) * aiState.W.denialWeight +
      Math.random() * 0.05;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  return bestScore < -1 ? -1 : bestIdx;
}
