import type { Cost } from './cost';
import type { ResourceType } from './resource-type';

export interface BuildingDefinition {
  name: string;
  icon: string;
  cost: Cost;
  desc: string;
  income?: ResourceType;
  cardWeight: number;
  cardColor: string;
  short: string;
}
