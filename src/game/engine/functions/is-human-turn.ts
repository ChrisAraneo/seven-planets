// NOTE: This function is not used anywhere in the current codebase.
// The store implements the same logic as a Vue computed property instead.
import { getBusy } from '@/stores/game/getters/get-busy';
import { getOver } from '@/stores/game/getters/get-over';
import { getHumanResolve } from '@/game/actions/common/resolver-state';

export function isHumanTurn(): boolean {
  return getHumanResolve() !== null && !getBusy() && !getOver();
}
