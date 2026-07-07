import { mastermindEvaluateTrade } from '@/game/ai/ai';
import { handValue, RESOURCE_TYPES } from '@/game/constants';
import type { Cost, Player } from '@/game/types';
import { getState } from '../state';
import { alivePlayers } from './alive-players';
import { currentGoal } from './current-goal';
import { persOf } from './pers-of';
import { playerStrength } from './player-strength';

// Ai = the player being ASKED to accept. gives/gets are from ai's perspective.
export function aiEvaluateTrade(
  ai: Player,
  gives: Cost,
  gets: Cost,
  proposer: Player | null = null,
): boolean {
  // Only resource cards may be traded
  for (const t in gives) {
    if (!RESOURCE_TYPES.includes(t as never) && (gives[t] || 0) > 0) {
      return false;
    }
  }
  for (const t in gets) {
    if (!RESOURCE_TYPES.includes(t as never) && (gets[t] || 0) > 0) {
      return false;
    }
  }
  for (const t in gives) {
    if ((ai.hand[t] || 0) < gives[t]) {
      return false;
    }
  }
  // MASTERMIND weighs offers against its own build plan (see ./ai).
  if (persOf(ai) === 'mastermind') {
    return mastermindEvaluateTrade(getState(), ai, gives, gets, proposer);
  }
  const vOut = handValue(gives);
  const vIn = handValue(gets);
  const goal = currentGoal(ai);
  if (goal) {
    for (const t in gives) {
      const kept = ai.hand[t] - gives[t];
      if (kept < (goal.cost[t] || 0) && vIn < vOut * 1.4) {
        return false;
      }
    }
  }
  // Anti-kingmaker: refuse or demand strongly better terms when trading with the leader.
  if (proposer && proposer.id !== ai.id) {
    const allStr = alivePlayers().map((x) => playerStrength(x));
    const avgStr = allStr.reduce((a, b) => a + b, 0) / (allStr.length || 1);
    if (playerStrength(proposer) > avgStr * 1.3 && vIn < vOut * 1.6) {
      return false;
    }
  }
  // Resource selectivity: accept readily only when receiving a needed resource.
  const needed = goal
    ? RESOURCE_TYPES.filter((t) => (goal.cost[t] || 0) > (ai.hand[t] || 0))
    : [];
  const receivingNeeded =
    needed.length > 0 &&
    Object.keys(gets).some((t) => needed.includes(t as never));
  const persAI = persOf(ai);
  const baseThreshold =
    persAI === 'militarist'
      ? 1.2
      : persAI === 'hoarder'
        ? 1.1
        : persAI === 'fortifier'
          ? 1.05
          : persAI === 'rusher' || persAI === 'economist'
            ? 0.85
            : 0.95;
  const threshold = receivingNeeded
    ? baseThreshold
    : Math.max(1.9, baseThreshold * 1.7);
  return vIn >= vOut * threshold;
}
