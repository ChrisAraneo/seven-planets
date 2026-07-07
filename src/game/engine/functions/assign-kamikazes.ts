import { shuffleArr } from '@/game/constants';
import { getState } from '../state';

// KAMIKAZE (Hard mode) — flag `count` random living AI as kamikazes. Their only
// Conquest target becomes the human; every other AI ignores them. Called once
// At game start from the store (chooseDifficulty).
export function assignKamikazes(count: number): void {
  for (const p of getState().players) {
    p.kamikaze = false;
  }
  if (count <= 0) {
    return;
  }
  const ai = shuffleArr(
    getState().players.filter((p) => !p.isHuman && p.alive),
  );
  for (const p of ai.slice(0, count)) {
    p.kamikaze = true;
  }
}
