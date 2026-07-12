import { getOver } from '../getters/get-over';
import { getTurn } from '../getters/get-turn';

import { playTurn } from './play-turn';
import type { EngineGen } from './engine-driver';

// Play turns until the game is over or the turn cap is hit. The live flags
// are re-read each step after the previous turn settles.
export function* playTurns(maxTurns: number): EngineGen {
  while (!getOver() && getTurn() < maxTurns) {
    yield* playTurn();
  }
}
