import type { EffectSpec } from '../interfaces/effect-event';
import type { GameState } from '../interfaces/game-state';

const EFFECT_TAIL_CAP = 32;

export function emitEffect(state: GameState, effect: EffectSpec): GameState {
  return {
    ...state,
    effectSeq: state.effectSeq + 1,
    effects: [...state.effects, { ...effect, seq: state.effectSeq + 1 }].slice(
      -EFFECT_TAIL_CAP,
    ),
  };
}
