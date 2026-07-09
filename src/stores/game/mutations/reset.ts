import { markRaw } from 'vue';
import { ENGINE } from '@/game/engine/engine';
import { resetResolvers } from '@/game/engine/common/resolver-state';
import type { GameModuleState } from '../game';

export function reset(
  gameModuleState: GameModuleState,
  opts: { raw?: boolean } = {},
) {
  gameModuleState.state = opts.raw
    ? markRaw(ENGINE.initializeState())
    : ENGINE.initializeState();
  resetResolvers();
}
