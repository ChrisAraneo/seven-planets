import { buildState, setState } from '../state';
import { assignKamikazes } from './assign-kamikazes';
import { getState } from '../state';
import { playTurn } from './play-turn';

export async function simulateGameWithPersonalities(
  personalities: string[],
  maxTurns = 400,
  opts: { kamikazeCount?: number } = {},
) {
  setState(buildState());
  for (
    let i = 0;
    i < getState().players.length && i < personalities.length;
    i++
  ) {
    getState().players[i].personality = personalities[i];
  }
  // Difficulty kamikazes hunt only seat 0 (the human seat) — applied AFTER
  // BuildState, which is what resets the kamikaze flags each game.
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
