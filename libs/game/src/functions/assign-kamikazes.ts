import { shuffleArr } from '../config/constants';
import type { GameState } from '../interfaces/game-state';

import { updatePlayers } from './update-players';

// Clear every player's kamikaze flag, then mark a random `count` of alive AI seats
// as kamikaze (Hard mode). Pure: returns a new state.
export function assignKamikazes(state: GameState, count: number): GameState {
  const cleared = updatePlayers(state, (p) =>
    p.kamikaze ? { ...p, kamikaze: false } : p,
  );
  if (count <= 0) {
    return cleared;
  }
  const ai = shuffleArr(cleared.players.filter((p) => !p.isHuman && p.alive));
  const chosen = new Set(ai.slice(0, count).map((p) => p.id));
  return updatePlayers(cleared, (p) =>
    chosen.has(p.id) ? { ...p, kamikaze: true } : p,
  );
}
