import type { EffectSpec } from '../interfaces/effect-event';
import type { GameState } from '../interfaces/game-state';

// Append a presentation-effect event, keeping the tail capped at 32. Pure:
// Returns a new state with a new effects array; the input is untouched.
// `effectSeq` is monotonic across the whole game so the presentation layer
// Can track which events it has already played even after the cap trims.
// Presentation-effect tail cap.
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
