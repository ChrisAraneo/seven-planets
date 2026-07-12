import type { Phase } from './phase';
import type { PoolType } from './pool-type';
import type { Player } from './player';
import type { Planet } from './planet';
import type { LogEntry } from './log-entry';
import type { PendingOffer } from './pending-offer';
import type { GameOver } from './game-over';
import type { EffectEvent } from './effect-event';

export interface GameState {
  turn: number;
  phase: Phase;
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
  /** A trade offer awaiting the target seat's accept/decline (reactive). */
  pendingOffer: PendingOffer | null;
}
