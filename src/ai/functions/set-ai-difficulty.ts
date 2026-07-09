import { getAiState } from '@/ai/state';

import type { AiDifficulty } from './ai-difficulty';

export function setAiDifficulty(d: AiDifficulty): void {
  const aiState = getAiState();
  aiState.difficulty = d;
}

export { type AiDifficulty } from './ai-difficulty';
