import type { Action } from '../actions/action';
import type { GameState } from '../interfaces/game-state';
import { chain } from '../utils/chain';
import { advance } from './internal/advance';
import { applyAction } from './internal/apply-action';

export const reduce = (state: GameState, action: Action): GameState =>
  chain(applyAction(state, action)).thru(advance).value();
