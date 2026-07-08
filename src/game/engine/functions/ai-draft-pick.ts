import { mastermindDraftPick } from '@/game/ai/functions/mastermind-draft-pick';
import type { Planet, Player } from '@/game/types';
import { getGameState } from '@/stores/game-state';

import { canPickCard } from './can-pick-card';

// Pick for `planet`'s draft turn. Returns -1 when nothing in the pool is pickable.
export function aiDraftPick(p: Player, planet: Planet): number {
  const state = getGameState();
  const pickable = state.pool.map((t) => canPickCard(p, t, planet));
  return mastermindDraftPick(p, planet, pickable);
}
