import { buildState, getState, setState } from '../state';
import { assignKamikazes } from './assign-kamikazes';
import { playTurn } from './play-turn';

export async function simulateGameWithPersonalities(
  _personalities: string[],
  maxTurns = 400,
  opts: { kamikazeCount?: number } = {},
) {
  setState(buildState());
  assignKamikazes(opts.kamikazeCount ?? 0);

  while (!getState().over && getState().turn < maxTurns) {
    await playTurn();
  }

  return {
    turns: getState().turn,
    winner:
      getState().over && getState().over?.winner
        ? {
            id: getState().over?.winner?.id,
            name: getState().over?.winner?.name,
            personality: getState().over?.winner?.personality,
          }
        : null,
    reason: getState().over ? getState()?.over?.reason || 'timeout' : 'timeout',
  };
}
