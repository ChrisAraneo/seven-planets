import { shuffleArr } from '@/game/constants';
import { getGameState } from '@/stores/game-state';
// KAMIKAZE (Hard mode) — flag `count` random living AI as kamikazes. Their only
// Conquest target becomes the human; every other AI ignores them. Called once
// At game start from the store (chooseDifficulty).
export function assignKamikazes(count: number): void {
  const state = getGameState();
  for (const p of state.players) {
    p.kamikaze = false;
  }
  if (count <= 0) {
    return;
  }
  const ai = shuffleArr(state.players.filter((p) => !p.isHuman && p.alive));
  for (const p of ai.slice(0, count)) {
    p.kamikaze = true;
  }
}
