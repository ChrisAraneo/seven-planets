import type { EngineCursor } from '../interfaces/engine-cursor';
import type { GameState } from '../interfaces/game-state';

export type DraftCursor = Extract<EngineCursor, { phase: 'draft' }>;
export type ActionCursor = Extract<EngineCursor, { phase: 'action' }>;

export type DraftFrame = { state: GameState; cursor: DraftCursor };
export type ActionFrame = { state: GameState; cursor: ActionCursor };
export type SeatFrame = DraftFrame | ActionFrame;
