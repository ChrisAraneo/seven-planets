import { match } from 'ts-pattern';
import { getOver } from '../getters/get-over';
import { getTurn } from '../getters/get-turn';
import { NO_PRESENTATION } from '../config/constants';
import type { PresentationHooks } from '../interfaces/presentation-hooks';

import { playTurn } from './play-turn';

// Play turns until the game is over or the turn cap is hit. Recursion instead of
// a loop: each step re-reads the live flags after the previous turn settles.
export async function playTurns(
  maxTurns: number,
  hooks: PresentationHooks = NO_PRESENTATION,
): Promise<void> {
  return match(!getOver() && getTurn() < maxTurns)
    .with(true, () => playTurn(hooks).then(() => playTurns(maxTurns, hooks)))
    .otherwise(async (): Promise<void> => undefined);
}
