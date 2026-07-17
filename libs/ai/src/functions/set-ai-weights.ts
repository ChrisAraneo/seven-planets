import { getAiState } from '../state';
import type { Weights } from '../weights';

export const setAiWeights = (patch: Partial<Weights>): void => {
  const aiState = getAiState();
  aiState.tuned = { ...aiState.tuned, ...patch };
};
