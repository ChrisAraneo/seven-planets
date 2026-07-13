import type { EffectEvent } from './effect-event';
import type { EngineCursor } from './engine-cursor';
import type { GameOver } from './game-over';
import type { LogEntry } from './log-entry';
import type { PendingOffer } from './pending-offer';
import type { Phase } from './phase';
import type { Planet } from './planet';
import type { Player } from './player';
import type { PoolType } from './pool-type';

export interface GameState {
  turn: number;
  phase: Phase;
  /** The engine's position as data (see EngineCursor) — advanced by the
      reducer; `phase` above stays as the UI-facing summary of it. */
  cursor: EngineCursor;
  /** Turn cap: the reducer stops before starting a turn past this. */
  maxTurns: number;
  over: GameOver | null;
  pool: PoolType[];
  activeId: number;
  draftPlanetId: number;
  singularityAnnounced: boolean;
  startIdx: number;
  players: Player[];
  planets: Planet[];
  log: LogEntry[];
  /** Presentation-effect events, capped tail (reactive) — the UI plays
      animations in response to these appearing on the state. */
  effects: EffectEvent[];
  /** Monotonic count of all effects ever emitted this game. */
  effectSeq: number;
  /** UI status line shown in the pool zone (reactive). */
  status: string;
  /** True while the seat in play must pick a pool card (reactive). */
  awaitingPick: boolean;
  /** True while it is the human's action turn (reactive). */
  awaitingAction: boolean;
  /** Monotonic count of input requests: bumped each time the engine parks
      awaiting a pick/action (reactive) — the AI watches this the same way
      the effects player watches effectSeq. */
  inputSeq: number;
  /** A trade offer awaiting the target seat's accept/decline (reactive). */
  pendingOffer: PendingOffer | null;
}
