import { getGameStateStore } from '@/stores/game-state';

import { assignKamikazes } from './assign-kamikazes';
import { playTurn } from './play-turn';

export async function simulateGameWithPersonalities(
  _personalities: string[],
  maxTurns = 400,
  opts: { kamikazeCount?: number } = {},
) {
  // Each simulated game runs on a fresh state in the game-state store; every
  // Engine/AI function reads it from there. Games run strictly sequentially,
  // So resetting between games is safe. `raw` skips reactivity — nothing
  // Renders here and the proxy overhead would throttle the simulation.
  const gameState = getGameStateStore();
  gameState.reset({ raw: true });
  const { state } = gameState;
  assignKamikazes(opts.kamikazeCount ?? 0);

  while (!state.over && state.turn < maxTurns) {
    await playTurn();
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
