import { mastermindDraftPick } from '@/game/ai/functions/mastermind-draft-pick';
import type { GameState, Planet, Player } from '@/game/types';
import { canPickCard } from './can-pick-card';

// Pick for `planet`'s draft turn. Returns -1 when nothing in the pool is pickable.
export function aiDraftPick(
  state: GameState,
  p: Player,
  planet: Planet,
): number {
  const pickable = state.pool.map((t) => canPickCard(state, p, t, planet));
  return mastermindDraftPick(state, p, planet, pickable);
}
