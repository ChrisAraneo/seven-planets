import { getOver } from '../getters/get-over';
import { getTurn } from '../getters/get-turn';
import { getGameState, resetGameState } from '../game-state';

import { assignKamikazes } from './assign-kamikazes';
import { playTurn } from './play-turn';

export async function simulateGame(
  maxTurns = 400,
  opts: { kamikazeCount?: number } = {},
) {
  // Each simulated game runs on a fresh state in the store's game module;
  // every engine/AI function reads it from there. Games run strictly
  // sequentially, so resetting between games is safe. The state must stay
  // reactive: the AI is a store plugin that watches the game flags, so it
  // only reacts (drives AI seats) when those mutations are observable.
  resetGameState();
  Object.assign(
    getGameState(),
    assignKamikazes(getGameState(), opts.kamikazeCount ?? 0),
  );

  while (!getOver() && getTurn() < maxTurns) {
    await playTurn();
  }

  const over = getOver();
  return {
    turns: getTurn(),
    winner: over?.winner
      ? {
          id: over.winner.id,
          name: over.winner.name,
          isHuman: over.winner.isHuman,
        }
      : null,
    reason: over ? over.reason || 'timeout' : 'timeout',
  };
}
