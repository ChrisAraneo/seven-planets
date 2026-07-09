import { getGameState } from '@/stores/game-state';
import {
  COMBAT,
  HOME_FIELD,
  PACIFIST_DEF_BONUS,
  SHIELD_DEFENSE,
} from '@/game/constants';
import { singularityDefBonus } from '@/game/shared/singularity-def-bonus';
import type { Planet } from '@/game/types';

export function defenseBaseOf(pl: Planet, troops = pl.troops): number {
  const pac = getGameState().players[pl.ownerId]?.pacifistStatus
    ? PACIFIST_DEF_BONUS
    : 0;
  return (
    COMBAT.defensePerTroop * troops +
    (pl.buildings.SHIELD || 0) * SHIELD_DEFENSE +
    pac +
    singularityDefBonus(pl) +
    HOME_FIELD
  );
}
