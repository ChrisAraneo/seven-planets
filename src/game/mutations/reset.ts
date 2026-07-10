import { markRaw } from 'vue';
import { initializeState } from '@/game/functions/initialize-state';
import { resetResolvers } from '@/game/functions/resolver-state';
import type { GameModuleState } from '../game';

export function reset(
  gameModuleState: GameModuleState,
  opts: { raw?: boolean } = {},
) {
  gameModuleState.state = opts.raw
    ? markRaw(initializeState())
    : initializeState();
  resetResolvers();
}
