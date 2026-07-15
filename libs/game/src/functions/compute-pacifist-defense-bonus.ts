import { PACIFIST_DEF_BONUS } from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';

// Extra flat defense every pacifist owner's planet enjoys.
// Branch-free arithmetic: this sits in the AI's battle-prediction hot loop.
export function computePacifistDefenseBonus(
  state: GameState,
  planet: Planet,
): number {
  return (
    Number(Boolean(state.players[planet.ownerId]?.hasPacifistStatus)) *
    PACIFIST_DEF_BONUS
  );
}
