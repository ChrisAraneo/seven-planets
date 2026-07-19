export interface CardDefinition {
  name: string;
  icon: string;
  color: string;
  weight: number;
  value: number;
  isAction?: boolean;
  isBuilding?: boolean;
  isInfluenceCard?: boolean;
}
