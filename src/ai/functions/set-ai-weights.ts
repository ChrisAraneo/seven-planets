import { getAiState } from '@/ai/state';

import type { Weights } from '../weights';

export function setAiWeights(patch: Partial<Weights>): void {
  const aiState = getAiState();
  aiState.tuned = { ...aiState.tuned, ...patch };
}
