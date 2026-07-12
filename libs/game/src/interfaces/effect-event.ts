/* Presentation effects as DATA on the game state. Game logic appends these
   while it mutates state (see functions/emit-effect.ts); the presentation
   layer watches the state and plays matching animations in response. The
   game core never awaits an animation — effects are a one-way record of
   "what just happened", keyed by a monotonic `seq`. */

export type EffectSpec =
  | { kind: 'rocket'; fromId: number; toId: number; color: string }
  | { kind: 'boom'; planetId: number }
  | { kind: 'floatText'; planetId: number; text: string; color: string };

export type EffectEvent = EffectSpec & { seq: number };
