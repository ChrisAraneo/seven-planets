import {
  COMBAT,
  HOME_FIELD,
  PACIFIST_DEF_BONUS,
  SHIELD_DEFENSE,
} from '@/game/constants';
import type { GameState, Planet } from '@/game/types';
import { singularityDefBonus } from './singularity-def-bonus';

export function defenseBaseOf(
  s: GameState,
  pl: Planet,
  troops = pl.troops,
): number {
  const pac = s.players[pl.ownerId]?.pacifistStatus ? PACIFIST_DEF_BONUS : 0;
  return (
    COMBAT.defensePerTroop * troops +
    (pl.buildings.SHIELD || 0) * SHIELD_DEFENSE +
    pac +
    singularityDefBonus(pl) +
    HOME_FIELD
  );
}
