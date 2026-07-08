import type { Player } from '@/game/types';
import { getAiStore } from '@/stores/ai';

export function activateWeightsFor(p: Player): void {
  const aiState = getAiStore();
  const { difficulty, tuned } = aiState;
  if (difficulty && !p.isHuman) {
    aiState.W = {
      ...tuned,
      planHorizon: Math.max(
        1,
        tuned.planHorizon + (difficulty.planHorizonDelta ?? 0),
      ),
      minConquerProb:
        tuned.minConquerProb * (difficulty.minConquerProbMult ?? 1),
      denialWeight: tuned.denialWeight * (difficulty.denialWeightMult ?? 1),
    };
    aiState.randomPickChance = Math.max(
      0,
      Math.min(1, difficulty.randomPickChance ?? 0),
    );
  } else {
    aiState.W = tuned;
    aiState.randomPickChance = 0;
  }
}
