import type { Planet, Player } from '@seven-planets/game';
import { getGameStateLastValue } from '@seven-planets/game';

import { getAiState } from '../state';
import { activateWeightsFor } from './activate-weights-for';
import { computeDenialValue } from './compute-denial-value';
import { computeOwnDraftValue } from './compute-own-draft-value';
import { getPlan } from './get-plan';

export function computeMastermindDraftPick(
  player: Player,
  draftPlanet: Planet,
  pickable: boolean[],
): number {
  const aiState = getAiState();
  activateWeightsFor(player);
  if (
    aiState.randomPickChance > 0 &&
    Math.random() < aiState.randomPickChance
  ) {
    const randomIndex = pickRandomIndex(pickable);
    if (randomIndex !== -1) {
      return randomIndex;
    }
  }
  return pickBestIndex(player, draftPlanet, pickable);
}

function pickRandomIndex(pickable: boolean[]): number {
  const options: number[] = [];
  for (let index = 0; index < getGameStateLastValue().pool.length; index++) {
    if (pickable[index]) {
      options.push(index);
    }
  }
  return options.length > 0
    ? options[Math.floor(Math.random() * options.length)]
    : -1;
}

function pickBestIndex(
  player: Player,
  draftPlanet: Planet,
  pickable: boolean[],
): number {
  const aiState = getAiState();
  const plan = getPlan(player);
  let bestIndex = -1;
  let bestScore = -Infinity;
  for (let index = 0; index < getGameStateLastValue().pool.length; index++) {
    if (pickable[index]) {
      const poolType = getGameStateLastValue().pool[index];
      const copies = getGameStateLastValue().pool.filter(
        (eachPoolType) => eachPoolType === poolType,
      ).length;
      const score =
        computeOwnDraftValue(player, draftPlanet, poolType, plan) +
        (computeDenialValue(player, poolType) / copies) *
          aiState.W.denialWeight +
        Math.random() * 0.05;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
  }
  return bestScore < -1 ? -1 : bestIndex;
}
