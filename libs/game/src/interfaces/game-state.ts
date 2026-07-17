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
  cursor: EngineCursor;
  maxTurns: number;
  over: GameOver | null;
  pool: PoolType[];
  activeId: number;
  draftPlanetId: number;
  isSingularityAnnounced: boolean;
  startIdx: number;
  players: Player[];
  planets: Planet[];
  log: LogEntry[];
  effects: EffectEvent[];
  effectSeq: number;
  status: string;
  isAwaitingPick: boolean;
  isAwaitingAction: boolean;
  inputSeq: number;
  pendingOffer: PendingOffer | null;
}
