import { getGameState } from '@/stores/game-state';
import { shuffleArr } from '@/game/constants';
// KAMIKAZE (Hard mode) — flag `count` random living AI as kamikazes. Their only
// Conquest target becomes the human; every other AI ignores them. Called once
// At game start from the store (chooseDifficulty).
export function assignKamikazes(count: number): void {
  for (const p of getGameState().players) {
    p.kamikaze = false;
  }
  if (count <= 0) {
    return;
  }
  const ai = shuffleArr(
    getGameState().players.filter((p) => !p.isHuman && p.alive),
  );
  for (const p of ai.slice(0, count)) {
    p.kamikaze = true;
  }
}
