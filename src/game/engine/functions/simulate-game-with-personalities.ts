import { getOver } from '@/stores/game/getters/get-over';
import { getTurn } from '@/stores/game/getters/get-turn';
import { resetGameState } from '@/stores/game-state';

import { assignKamikazes } from './assign-kamikazes';
import { playTurn } from './play-turn';

export async function simulateGameWithPersonalities(
  _personalities: string[],
  maxTurns = 400,
  opts: { kamikazeCount?: number } = {},
) {
  // Each simulated game runs on a fresh state in the store's game module;
  // Every engine/AI function reads it from there. Games run strictly
  // Sequentially, so resetting between games is safe. `raw` skips
  // Reactivity — nothing renders here and the proxy overhead would
  // Throttle the simulation.
  resetGameState({ raw: true });
  assignKamikazes(opts.kamikazeCount ?? 0);

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
          personality: over.winner.personality,
        }
      : null,
    reason: over ? over.reason || 'timeout' : 'timeout',
  };
}
