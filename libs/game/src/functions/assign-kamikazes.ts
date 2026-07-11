import { shuffleArray } from '../config/constants';
import type { GameState } from '../interfaces/game-state';

import { updatePlayers } from './update-players';

export function assignKamikazes(state: GameState, count: number): GameState {
  const cleared = updatePlayers(state, (player) =>
    player.kamikaze ? { ...player, kamikaze: false } : player,
  );

  if (count <= 0) {
    return cleared;
  }

  const ai = shuffleArray(
    cleared.players.filter((player) => !player.isHuman && player.alive),
  );
  const chosen = new Set(ai.slice(0, count).map((player) => player.id));

  return updatePlayers(cleared, (player) =>
    chosen.has(player.id) ? { ...player, kamikaze: true } : player,
  );
}
