import type {
  Cost,
  InfluenceOptions,
  InfluenceType,
  Planet,
  Player,
} from '@seven-planets/game';

export type MastermindDecision =
  | { kind: 'influence'; type: InfluenceType; options: InfluenceOptions }
  | { kind: 'attack'; source: Planet; target: Planet; n: number }
  | { kind: 'recruit'; planet: Planet }
  | { kind: 'move'; from: Planet; to: Planet; n: number }
  | { kind: 'trade'; partner: Player; gives: Cost; gets: Cost };
