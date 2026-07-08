import { getAiStore } from '@/stores/ai';

import type { AiDifficulty } from './ai-difficulty';

export function setAiDifficulty(d: AiDifficulty): void {
  const aiState = getAiStore();
  aiState.difficulty = d;
}

export { type AiDifficulty } from './ai-difficulty';
