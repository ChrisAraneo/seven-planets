import { getAiState } from '../state';
import type { Weights } from '../weights';

export function getAiWeights(): Weights {
  const aiState = getAiState();
  return { ...aiState.tuned };
}
