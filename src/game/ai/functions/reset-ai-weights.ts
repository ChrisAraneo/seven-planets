import { WEIGHTS } from '../weights';
import { aiState } from './ai-state';

export function resetAiWeights(): void {
  aiState.tuned = { ...WEIGHTS };
  aiState.W = { ...WEIGHTS };
  aiState.difficulty = null;
  aiState.randomPickChance = 0;
}
