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
