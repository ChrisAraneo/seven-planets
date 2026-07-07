import type { Weights } from '../weights';
import { aiState } from './ai-state';

export function setAiWeights(patch: Partial<Weights>): void {
  aiState.tuned = { ...aiState.tuned, ...patch };
}
