import { getGameStateLastValue } from '@seven-planets/game';
import { getAiState } from '../state';
import type { Planet, Player } from '@seven-planets/game';

import { activateWeightsFor } from './activate-weights-for';
import { denialValue } from './denial-value';
import { ownDraftValue } from './own-draft-value';
import { planFor } from './plan-for';

export function mastermindDraftPick(
  player: Player,
  getDraftPlanet: Planet,
  pickable: boolean[],
): number {
  const aiState = getAiState();
  activateWeightsFor(player);
  if (
    aiState.randomPickChance > 0 &&
    Math.random() < aiState.randomPickChance
  ) {
    const options: number[] = [];
    for (let index = 0; index < getGameStateLastValue().pool.length; index++) {
      if (pickable[index]) {
        options.push(index);
      }
    }
    if (options.length > 0) {
      return options[Math.floor(Math.random() * options.length)];
    }
  }
  const plan = planFor(player);
  let bestIdx = -1;
  let bestScore = -Infinity;
  for (
    let eachIndex = 0;
    eachIndex < getGameStateLastValue().pool.length;
    eachIndex++
  ) {
    if (!pickable[eachIndex]) {
      continue;
    }
    const poolType = getGameStateLastValue().pool[eachIndex];
    const copies = getGameStateLastValue().pool.filter(
      (poolType) => poolType === poolType,
    ).length;
    const score =
      ownDraftValue(player, getDraftPlanet, poolType, plan) +
      (denialValue(player, poolType) / copies) * aiState.W.denialWeight +
      Math.random() * 0.05;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = eachIndex;
    }
  }
  return bestScore < -1 ? -1 : bestIdx;
}
