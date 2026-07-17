export type EffectSpec =
  | { kind: 'rocket'; fromId: number; toId: number; color: string }
  | { kind: 'boom'; planetId: number }
  | { kind: 'floatText'; planetId: number; text: string; color: string };

export type EffectEvent = EffectSpec & { seq: number };
