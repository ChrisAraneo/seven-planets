import { getTurn } from '@seven-planets/game';
import { getAiState } from '../state';
import type { Player } from '@seven-planets/game';

import { KAMIKAZE_RISK } from './ai-constants';
import { alive } from './alive';

export function effMinConquerProb(p?: Player): number {
  const aiState = getAiState();
  const duel = alive().length === 2 ? 0.1 : 0;
  const reckless = p?.kamikaze ? KAMIKAZE_RISK : 0;
  return Math.max(
    0.25,
    aiState.W.minConquerProb -
      getTurn() * aiState.W.aggressionRamp -
      duel -
      reckless,
  );
}
