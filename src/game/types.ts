/* =====================================================================
   SEVEN PLANETS — shared type definitions
   ===================================================================== */

export type ResourceType = 'ORE' | 'CRYSTAL' | 'ENERGY' | 'SPICE' | 'RELIC';
export type ActionType = 'RECRUIT' | 'ATTACK' | 'MOVE' | 'TRADE';
export type CardType = ResourceType | ActionType;
export type BuildingType =
  | 'MINE'
  | 'EXTRACTOR'
  | 'SOLAR'
  | 'HARVESTER'
  | 'BARRACKS'
  | 'SHIELD'
  | 'SILO'
  | 'SPACEPORT'
  | 'EMBASSY'
  | 'LAB'
  | 'SINGULARITY';
export type InfluenceType =
  | 'SKIP_ARMY'
  | 'SKIP_PLANETS'
  | 'SKIP_INFLUENCE'
  | 'SKIP_TECH'
  | 'STEAL_ACTION'
  | 'COUP'
  | 'PEACE';

/** Anything that can appear as a card in the draft pool. */
export type PoolType = CardType | BuildingType | InfluenceType;

/** A per-player resource/action/influence tally, keyed by card type. */
export type Hand = Record<string, number>;
/** Building levels on a single planet, keyed by building type. */
export type BuildingLevels = Record<string, number>;
/** A partial resource cost, keyed by resource type. */
export type Cost = Record<string, number>;

export interface CardDef {
  name: string;
  icon: string;
  color: string;
  weight: number;
  value: number;
  action?: boolean;
  building?: boolean;
  influenceCard?: boolean;
}

export interface BuildingDef {
  name: string;
  icon: string;
  cost: Cost;
  desc: string;
  income?: ResourceType;
  cardWeight: number;
  cardColor: string;
  short: string;
}

export interface InfluenceCardDef {
  name: string;
  icon: string;
  cost: number;
  desc: string;
}

export interface PlanetStyle {
  light: string;
  dark: string;
  feature: string;
}

export interface PlayerDef {
  name: string;
  planet: string;
  color: string;
  human?: boolean;
  personality: string;
  styleIdx: number;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  isHuman: boolean;
  personality: string;
  hand: Hand;
  influence: number;
  skipTurns: number;
  skippedNow: boolean;
  alive: boolean;
  planets: number[];
  tradedThisTurn: boolean;
  /** Turn on which this player last launched an attack (0 = never). */
  lastAttackTurn: number;
  /** True while the player holds PACIFIST status (earned after PACIFIST_TURNS with
      no attack): +defense and +⭐ per planet. Attacking breaks the vow — it clears
      this flag and sets pacifismForfeited, so the bonus is lost for good. */
  pacifistStatus: boolean;
  /** Once true, the player broke a pacifist vow by attacking and can NEVER become
      a pacifist again (updatePacifistStatus will not re-promote them). */
  pacifismForfeited: boolean;
  /**
   * KAMIKAZE (Hard mode): an AI whose ONLY conquest target is the human player.
   * Every other AI ignores a kamikaze entirely — never attacking or couping it —
   * and a kamikaze attacks a little more recklessly. Always false outside Hard.
   */
  kamikaze: boolean;
}

export interface Planet {
  id: number;
  name: string;
  ownerId: number;
  buildings: BuildingLevels;
  troops: number;
  protectedUntil: number;
  x: number;
  y: number;
  r: number;
  styleIdx: number;
}

export interface GameOver {
  winner: Player | null;
  reason: 'conquest' | 'eliminated';
}

export interface LogEntry {
  msg: string;
  cls: string;
}

export type Phase = 'setup' | 'draft' | 'action';

export interface GameState {
  turn: number;
  phase: Phase;
  over: GameOver | null;
  pool: PoolType[];
  activeId: number;
  draftPlanetId: number;
  singularityAnnounced: boolean;
  startIdx: number;
  busy: boolean;
  players: Player[];
  planets: Planet[];
  log: LogEntry[];
  /** UI status line shown in the pool zone (reactive). */
  status: string;
  /** True while the seat in play must pick a pool card (reactive). */
  awaitingPick: boolean;
  /** True while it is the human's action turn (reactive). */
  awaitingAction: boolean;
  /** A trade offer awaiting the target seat's accept/decline (reactive). */
  pendingOffer: PendingOffer | null;
}

/** An incoming trade offer the target seat (`toId`) must respond to. */
export interface PendingOffer {
  fromId: number;
  toId: number;
  gives: Cost;
  gets: Cost;
}

/** A concrete trade offer passed between players. */
export interface TradeOffer {
  partner: Player;
  gives: Cost;
  gets: Cost;
}

/** Options carried when playing an influence card. */
export interface InfluenceOpts {
  target?: Player;
  cardType?: ActionType;
  planet?: Planet;
}
