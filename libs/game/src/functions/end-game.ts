import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';
import { chain } from '../utils/chain';
import { getStatusLine } from './get-status-line';
import { logOutcome } from './log-outcome';
import { setStatus } from './set-status';
import type { GameOverReason } from './trigger-game-over';

export const endGame = (
  state: GameState,
  winner: Player | null,
  reason: GameOverReason,
): GameState =>
  chain({ ...state, over: { winner, reason } } as GameState)
    .thru((current) => logOutcome(current, winner, reason))
    .thru((current) => setStatus(current, getStatusLine(winner, reason)))
    .thru((current) => ({ ...current, pendingOffer: null }))
    .value();
