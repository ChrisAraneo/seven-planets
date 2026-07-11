import { cloneDeep } from 'lodash-es';
import { shuffleArray } from '../config/constants';
import type { GameState } from '../interfaces/game-state';

import { updatePlayers } from './update-players';

export function assignKamikazes(state: GameState, count: number): GameState {
  const cleared = updatePlayers(cloneDeep(state), (player) => ({
    ...player,
    isKamikaze: false,
  }));

  if (count <= 0) {
    return cleared;
  }

  const aliveAiPlayers = shuffleArray(
    cleared.players.filter((player) => !player.isHuman && player.isAlive),
  );
  const chosen = new Set(
    aliveAiPlayers.slice(0, count).map((player) => player.id),
  );

  return updatePlayers(cleared, (player) =>
    chosen.has(player.id) ? { ...player, isKamikaze: true } : player,
  );
}
