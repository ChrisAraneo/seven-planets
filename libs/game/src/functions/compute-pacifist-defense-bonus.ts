import { PACIFIST_DEF_BONUS } from '../config/constants';
import type { GameState } from '../interfaces/game-state';
import type { Planet } from '../interfaces/planet';

export function computePacifistDefenseBonus(
  state: GameState,
  planet: Planet,
): number {
  return (
    Number(state.players[planet.ownerId]?.hasPacifistStatus ?? false) *
    PACIFIST_DEF_BONUS
  );
}
