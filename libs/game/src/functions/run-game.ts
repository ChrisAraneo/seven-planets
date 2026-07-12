import { assign } from 'lodash-es';
import { getGameState } from '../game-state';

import { log } from './log';
import { playTurns } from './play-turns';
import { startEngine, type EngineGen } from './engine-driver';

/* The whole game as one synchronous coroutine: it drives every turn and
   suspends at each seat's pool pick / action turn (see engine-driver.ts).
   Presentation effects fire in response to the state changes it makes —
   the engine never waits for an animation. */
function* engineRun(): EngineGen {
  const state = getGameState();
  assign(state, log(state, 'SEVEN PLANETS — seven worlds, one victor.', 'sys'));
  assign(
    state,
    log(
      state,
      'WIN by conquering every other planet. Research technology, upgrade buildings, raise armies.',
      'sys',
    ),
  );
  yield* playTurns(400);
  assign(getGameState(), { activeId: -1 });
}

export function runGame(): void {
  startEngine(() => engineRun());
}
