import { getAiStore } from '@/stores/ai';

import type { Weights } from '../weights';

export function setAiWeights(patch: Partial<Weights>): void {
  const aiState = getAiStore();
  aiState.tuned = { ...aiState.tuned, ...patch };
}
