import type { BuildingType } from './building-type';
import type { Cost } from './cost';
import type { Planet } from './planet';

export interface BuildGoal {
  id: BuildingType;
  planet: Planet;
  cost: Cost;
}
