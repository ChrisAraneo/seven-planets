import { markRaw } from 'vue';
import { initializeState } from '../functions/initialize-state';
import { resetResolvers } from '../functions/resolver-state';
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
