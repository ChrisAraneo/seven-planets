import type { EffectSpec } from '../interfaces/effect-event';
import type { GameState } from '../interfaces/game-state';

// Append a presentation-effect event, keeping the tail capped at 32. Pure:
// returns a new state with a new effects array; the input is untouched.
// `effectSeq` is monotonic across the whole game so the presentation layer
// can track which events it has already played even after the cap trims.
export function emitEffect(state: GameState, effect: EffectSpec): GameState {
  return {
    ...state,
    effectSeq: state.effectSeq + 1,
    effects: [...state.effects, { ...effect, seq: state.effectSeq + 1 }].slice(
      -32,
    ),
  };
}
