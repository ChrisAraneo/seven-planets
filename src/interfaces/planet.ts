import type { BuildingLevels } from './building-levels';

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
