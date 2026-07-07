import type { GameState, Player } from '@/game/types';
import { aiState } from './ai-state';
import { alive } from './alive';
import { KAMIKAZE_RISK } from './ai-constants';

export function effMinConquerProb(s: GameState, p?: Player): number {
  const duel = alive(s).length === 2 ? 0.1 : 0;
  const reckless = p?.kamikaze ? KAMIKAZE_RISK : 0;
  return Math.max(
    0.25,
    aiState.W.minConquerProb -
      s.turn * aiState.W.aggressionRamp -
      duel -
      reckless,
  );
}
