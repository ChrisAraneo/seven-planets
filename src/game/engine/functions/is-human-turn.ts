// NOTE: This function is not used anywhere in the current codebase.
// The store implements the same logic as a Vue computed property instead.
import { getHumanResolve } from '@/game/engine/functions/resolver-state';
import { getGameState } from '@/stores/game-state';

export function isHumanTurn(): boolean {
  const state = getGameState();
  return getHumanResolve() !== null && !state.busy && !state.over;
}
