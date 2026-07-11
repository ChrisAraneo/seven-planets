import { markRaw } from 'vue';

import type { GameState } from '../interfaces/game-state';
import type { GameModuleState } from '../game';

// Install a freshly-produced (immutable) GameState into the store module.
// Headless simulations install a markRaw'd state at reset to keep Vue's reactive
// proxies out of the engine hot loop; a spread-produced state is plain, so we
// re-apply markRaw when the module is in raw mode. Also usable directly (not only
// via commit) by mutation handlers for their final write-back.
export function setState(moduleState: GameModuleState, s: GameState): void {
  moduleState.state = moduleState.raw ? markRaw(s) : s;
}
