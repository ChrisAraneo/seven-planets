import type { EngineCursor } from '../interfaces/engine-cursor';
import type { GameState } from '../interfaces/game-state';
import type { Player } from '../interfaces/player';

export type DraftCursor = Extract<EngineCursor, { phase: 'draft' }>;
export type ActionCursor = Extract<EngineCursor, { phase: 'action' }>;

/* A cursor paired with the state it sits on — the value the draft/action
   step ladders match over. */
export type DraftFrame = { state: GameState; cursor: DraftCursor };
export type ActionFrame = { state: GameState; cursor: ActionCursor };
export type SeatFrame = DraftFrame | ActionFrame;

export function isQueueExhausted({ cursor }: SeatFrame): boolean {
  return cursor.seatIdx >= cursor.seatQueue.length;
}

export function seatPlayer({ state, cursor }: SeatFrame): Player {
  return state.players[cursor.seatQueue[cursor.seatIdx]];
}
