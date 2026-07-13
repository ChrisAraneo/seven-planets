import { getAiState } from '../state';

import { WEIGHTS } from '../weights';

export function resetAiWeights(): void {
  const aiState = getAiState();
  aiState.tuned = { ...WEIGHTS };
  aiState.W = { ...WEIGHTS };
  aiState.difficulty = null;
  aiState.randomPickChance = 0;
}
