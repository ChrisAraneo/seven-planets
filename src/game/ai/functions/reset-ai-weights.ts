import { getAiStore } from '@/stores/ai';

import { WEIGHTS } from '../weights';

export function resetAiWeights(): void {
  const aiState = getAiStore();
  aiState.tuned = { ...WEIGHTS };
  aiState.W = { ...WEIGHTS };
  aiState.difficulty = null;
  aiState.randomPickChance = 0;
}
