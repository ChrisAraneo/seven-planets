import { match } from 'ts-pattern';

import type { GameState } from '../interfaces/game-state';
import { log } from './log';

export const logWhenTurnIs = (
  state: GameState,
  turn: number,
  message: string,
): GameState =>
  match(state.turn)
    .with(turn, () => log(state, message, 'sys'))
    .otherwise(() => state);
