import { getAiState } from '../state';
import type { AiDifficulty } from './ai-difficulty';

export const setAiDifficulty = (aiDifficulty: AiDifficulty): void => {
  const aiState = getAiState();
  aiState.difficulty = aiDifficulty;
};

export { type AiDifficulty } from './ai-difficulty';
