import { buildState, setState } from '../state';
import { assignKamikazes } from './assign-kamikazes';
import { playTurn } from './play-turn';

export async function simulateGameWithPersonalities(
  _personalities: string[],
  maxTurns = 400,
  opts: { kamikazeCount?: number } = {},
) {
  const state = buildState();
  setState(state);
  assignKamikazes(state, opts.kamikazeCount ?? 0);

  while (!state.over && state.turn < maxTurns) {
    await playTurn(state);
  }

  return {
    turns: state.turn,
    winner:
      state.over && state.over?.winner
        ? {
            id: state.over?.winner?.id,
            name: state.over?.winner?.name,
            personality: state.over?.winner?.personality,
          }
        : null,
    reason: state.over ? state?.over?.reason || 'timeout' : 'timeout',
  };
}
