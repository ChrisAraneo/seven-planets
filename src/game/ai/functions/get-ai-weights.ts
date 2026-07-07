// NOTE: This function is only used in src/game/tune.ts, which is a Node-only
// tuning script excluded from the main build (tsconfig.app.json).
import type { Weights } from '../weights';
import { aiState } from './ai-state';

export function getAiWeights(): Weights {
  return { ...aiState.tuned };
}
