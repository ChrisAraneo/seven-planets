import { getGameState } from '@/stores/game-state';

import { doAttack } from '../engine/functions/do-attack';
import { hasActionCard } from '../engine/functions/has-action-card';
import { setBusy } from '../engine/functions/set-busy';

/* The `attack` store action: launch a rocket from one planet at another.
   The human's AttackModal and the AI agent both dispatch this. Returns
   whether an Attack card was spent on the launch attempt. */
export async function attack(payload: {
  playerId: number;
  sourceId: number;
  targetId: number;
  n: number;
}): Promise<boolean> {
  const state = getGameState();
  const { playerId, sourceId, targetId, n } = payload;
  if (playerId !== state.activeId || state.over) {
    return false;
  }
  const p = state.players[playerId];
  if (!hasActionCard(p, 'ATTACK')) {
    return false;
  }
  setBusy(true);
  try {
    await doAttack(p, state.planets[sourceId], state.planets[targetId], n);
  } finally {
    setBusy(false);
  }
  return true;
}
