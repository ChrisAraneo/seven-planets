import { mastermindDraftPick } from '@/game/ai';
import type { Planet, Player } from '@/game/types';
import { getState } from '../state';
import { canPickCard } from './can-pick-card';

// Pick for `planet`'s draft turn. Returns -1 when nothing in the pool is pickable.
export function aiDraftPick(p: Player, planet: Planet): number {
  const pickable = getState().pool.map((t) => canPickCard(p, t, planet));
  return mastermindDraftPick(getState(), p, planet, pickable);
}
