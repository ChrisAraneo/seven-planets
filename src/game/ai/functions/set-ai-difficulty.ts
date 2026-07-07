import type { AiDifficulty } from './ai-difficulty';
import { aiState } from './ai-state';

export type { AiDifficulty };

export function setAiDifficulty(d: AiDifficulty): void {
  aiState.difficulty = d;
}
