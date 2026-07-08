import { getAiStore } from '@/stores/ai';

// NOTE: This function is only used in src/game/tune.ts, which is a Node-only
// Tuning script excluded from the main build (tsconfig.app.json).
import type { Weights } from '../weights';

export function getAiWeights(): Weights {
  const aiState = getAiStore();
  return { ...aiState.tuned };
}
