import type { BuildingLevels } from './building-levels';

export interface Planet {
  id: number;
  name: string;
  ownerId: number;
  buildings: BuildingLevels;
  troops: number;
  protectedUntil: number;
  /** True when an L3 Shield missed its per-turn 💎 upkeep this turn —
      the shield projects only SHIELD_UNPOWERED_DEFENSE until next upkeep. */
  shieldUnpowered: boolean;
  x: number;
  y: number;
  r: number;
  styleIdx: number;
}
