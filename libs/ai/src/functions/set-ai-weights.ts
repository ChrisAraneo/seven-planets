import { getAiState } from '../state';
import type { Weights } from '../weights';

export function setAiWeights(patch: Partial<Weights>): void {
  const aiState = getAiState();
  aiState.tuned = { ...aiState.tuned, ...patch };
}
