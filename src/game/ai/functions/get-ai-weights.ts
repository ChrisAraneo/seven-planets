import type { Weights } from '../weights';
import { aiState } from './ai-state';

export function getAiWeights(): Weights {
  return { ...aiState.tuned };
}
