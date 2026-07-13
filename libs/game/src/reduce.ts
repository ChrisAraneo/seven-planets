import { advance } from './functions/advance';
import { applyIntent } from './functions/apply-intent';
import type { GameIntent } from './intents';
import type { GameState } from './interfaces/game-state';

/* The whole game core: apply the intent's own semantics, then advance the
   game (turn preludes, draft passes, phase transitions) until it next needs
   input. state$ is the fold of this over the intent stream (see state.ts). */
export function reduce(state: GameState, intent: GameIntent): GameState {
  return advance(applyIntent(state, intent));
}
