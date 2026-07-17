import { getAiState } from '../state';
import type { AiDifficulty } from './ai-difficulty';

export function setAiDifficulty(aiDifficulty: AiDifficulty): void {
  const aiState = getAiState();
  aiState.difficulty = aiDifficulty;
}

export { type AiDifficulty } from './ai-difficulty';
