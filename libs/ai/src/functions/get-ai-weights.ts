import { getAiState } from '../state';
import type { Weights } from '../weights';

export const getAiWeights = (): Weights => {
  const aiState = getAiState();
  return { ...aiState.tuned };
};
